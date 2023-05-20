import { Component, OnInit } from '@angular/core';
import { jsonService } from '../json-service';

@Component({
  selector: 'app-precompile',
  templateUrl: './precompile.component.html',
  styleUrls: ['./precompile.component.css'],
  providers: [jsonService]
})
export class PrecompileComponent implements OnInit{
  private hashes: any = {};
  output: string = "";
  constructor(private jsProvider: jsonService){

  }
  ngOnInit(): void {
    this.jsProvider.getSubscription("postleitzahlen.geojson").subscribe( data => {
      let zip: any = data;

      zip.features.forEach((feature: any) => {
        let lat = 0,
          lng = 0,
          count = 0;
          //Anzeige punkt wird errechnet aus: Summe aller X -Koordinaten / Anzahl Koordinaten und Summer aller Y-Koordinaten
        if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates[0].forEach((element: any) => {
            lat += element[1];
            lng += element[0];
            count++

          })
        } else if (feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates.forEach((polygon: any) => {
            polygon[0].forEach((element: number[]) => {
              lat += element[1];
              lng += element[0];
              count++
            })
          })
        } else {
          console.log("unknown shape: " + feature.geometry.type);
        }

        lat = lat / count;
        lng = lng / count;
        if (!isNaN(lat) && !isNaN(lng)) {
          this.hashes[feature.properties.postcode] = { lat: lat, lng: lng, name: feature.properties.name };
        }
      });
      this.output = JSON.stringify(this.hashes);
    });
  }

}
