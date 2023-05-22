import { AfterViewInit, ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

import { jsonService } from '../json-service';
import { Observable, forkJoin, tap } from 'rxjs';
import * as L from 'leaflet';
import 'leaflet.heat';

interface dataPoint {
  "count": number,
  "postcode": string,
  "name": string,
  "LatLng": L.LatLng
}
interface countData {
  "count": number,
  "postcode": string
}
interface displayLayer {
  an: boolean,
  text: string,
  layer: L.LayerGroup | L.HeatLayer
}
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  providers: [jsonService]
})

export class MapComponent implements OnInit {
  map: L.Map | undefined;
  private hashes: any = {};
  sortedData: dataPoint[] = [];
  top10: dataPoint[] = [];
  uploaded: boolean = false;
  errorList: { text: string }[] = [];
  layerList: displayLayer[] = [];
  constructor(private jsProvider: jsonService) {

  }
  onFileUpload(event: any) {
    let file: File = event.formData.get("csv");
    let r: FileReader = new FileReader();

    r.addEventListener(
      "load",
      () => {
        // this will then display a text file
        if (!r.result) {
          return;
        }
        let header = true;
        let data: countData[] = [];
        for (const line of r.result!.toString().split(/[\r\n]+/)) {
          //Erste Zeile Überspringen
          if (header) {
            header = false;
            continue
          }
          line.replaceAll('"', '');
          line.replaceAll("'", '');
          let count = <number><unknown>line.split(";")[1],
            postcode = line.split(";")[0];
          //führende 0en an postleitzahl
          switch (postcode.length) {
            case 5:
              break;
            case 4:
              postcode = "0" + postcode;
              break
            case 3:
              postcode = "00" + postcode;
              break
            case 2:
              postcode = "000" + postcode;
              break
            case 1:
              postcode = "0000" + postcode;
              break;
            default:
              break;
          }
          if (postcode.length > 5) {
            continue;
          }
          if (count > 0 && postcode) {
            if (this.hashes[postcode]) {
              data.push({
                "count": count,
                "postcode": postcode
              })
            } else {
              this.errorList.push({ text: "Postleitzahl ungültig: " + postcode });
            }

          } else {
            this.errorList.push({ text: "Fehlerhaftes Format oder 0 Wert: " + line });
          }

        }
        if (data.length > 0) {
          this.uploaded = true;
          this.createHeatData(data);
        }
        this.displayError()
      },
      false
    );
    r.readAsText(file);


  }
  getTop10Listed() {
    if (!this.map) {
      return;
    }
    let top10: dataPoint[] = []
    this.sortedData.forEach(element => {
      if (this.map!.getBounds().contains(element.LatLng)) {
        if (top10.length < 10) {
          top10.push(element);
        }
      }
    })
    this.top10 = top10;
  }
  addOpenStreetLayer() {
    let openStreetLayer = new L.TileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      minZoom: 5,
      maxZoom: 14,
      attribution: "<a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
    });
    openStreetLayer.addTo(this.map!);
  }
  ngOnInit(): void {
    this.map = L.map("map", {
      center: L.latLng(51.165691, 10.451526),
      zoom: 6
    });
    if (this.map) {
      this.addOpenStreetLayer();
      this.map.on("zoom", this.getTop10Listed, this)
      this.map.on("dragend", this.getTop10Listed, this)
    }

    const requests: Observable<any>[] = [];

    requests.push(this.jsProvider.getSubscription("plz.hash.json").pipe(tap(data => {
      this.hashes = data;
    })));
    forkJoin(requests).subscribe(() => {

      console.log('All subscriptions done');
    });
  }
  sortData(countData: any[]): any[] {
    let ret: any[] = [];
    countData.forEach(element => {
      if (this.hashes[element.postcode]) {
        ret.push({
          "count": element.count,
          "postcode": element.postcode,
          "name": this.hashes[element.postcode].name,
          "LatLng": new L.LatLng(this.hashes[element.postcode].lat, this.hashes[element.postcode].lng)
        })
      }
    })
    ret.sort((a, b) => (Number(a.count) < Number(b.count)) ? 1 : -1)
    return ret;
  }
  createHeatData(countData: countData[]): void {
    let markerLayer = new L.LayerGroup(); //Marker layer wird nur bei bestimmten Zoom eingeblendet
    let heatLayer = L.heatLayer([], {}).addTo(this.map!);
    countData.forEach(element => {
      if (this.hashes[element.postcode]) {
        const hash = this.hashes[element.postcode];

        heatLayer.addLatLng(new L.LatLng(hash.lat, hash.lng, element.count))

        markerLayer.addLayer(L.marker([hash.lat, hash.lng], {}).bindPopup(hash.name + " (" + element.postcode + "): " + element.count, { autoClose: true }));
      }
    })

    this.sortedData = this.sortData(countData);

    this.getTop10Listed();

    this.layerList.push({
      an: true,
      text: "Heatmap",
      layer: heatLayer
    })
    this.layerList.push({
      an: false,
      text: "Datenpunkte auf Karte",
      layer: markerLayer
    })

  }
  displayError() {
    if (this.errorList.length > 0) {
      this.errorList = [... this.errorList];
    }
  }
  onToggleLayer(displayLayer: displayLayer) {
    if (displayLayer.an) {
      displayLayer.an = false;
      this.map?.removeLayer(displayLayer.layer);
    } else {
      displayLayer.an = true;
      displayLayer.layer.addTo(this.map!)
    }
  }

}
