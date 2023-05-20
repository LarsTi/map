import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Subscription } from "rxjs";

@Injectable()
export class jsonService{
    constructor(private httpClient: HttpClient){

    }
    getSubscription(fileName: string){
        return this.httpClient.get("/assets/" + fileName);
    }

}