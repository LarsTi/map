import { AfterViewInit, Component, OnInit } from '@angular/core';

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
          let count = <number><unknown>line.split(";")[1],
            postcode = line.split(";")[0];
          if (count > 0 && postcode) {
            data.push({
              "count": count,
              "postcode": postcode
            })
          }

        }
        if (data.length > 0) {
          this.uploaded = true;
          this.createHeatData(data);
        }
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
    debugger;
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

    /*
    let countData: any;
    requests.push(this.jsProvider.getSubscription("heatdata.json").pipe(tap((data: any) => {
      countData = data.data;
    })));
    */
    requests.push(this.jsProvider.getSubscription("plz.hash.json").pipe(tap(data => {
      this.hashes = data;
    })));
    forkJoin(requests).subscribe(() => {

      //this.createHeatData(countData);

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
    ret.sort((a, b) => (a.count > b.count) ? -1 : 1)
    return ret;
  }
  createHeatData(countData: countData[]): void {
    let markerLayer = new L.LayerGroup(); //Marker layer wird nur bei bestimmten Zoom eingeblendet
    let heatLayer = L.heatLayer([], {}).addTo(this.map!);
    countData.forEach(element => {
      if (this.hashes[element.postcode]) {
        const hash = this.hashes[element.postcode];
        if (!hash) {
          console.log(element.postcode + " not found in hashes");
          return;
        }
        heatLayer.addLatLng(new L.LatLng(hash.lat, hash.lng, element.count))

        markerLayer.addLayer(L.marker([hash.lat, hash.lng], {}).bindPopup(hash.name + " (" + element.postcode + "): " + element.count, { autoClose: true }));
      }
    })

    this.sortedData = this.sortData(countData);

    this.getTop10Listed();


    let map = this.map!;
    if (map.getZoom() >= 11) {
      map.addLayer(markerLayer)
    }
    map.on("zoom", function () {
      if (map.getZoom() < 11) {
        map.removeLayer(markerLayer)
      } else {
        map.addLayer(markerLayer);
      }
    });
  }

}
