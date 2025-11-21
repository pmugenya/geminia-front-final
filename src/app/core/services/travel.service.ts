import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { TravelDuration, TravelRatesData } from '../user/user.types';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TravelService {

    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    getTravelDurations(): Observable<TravelDuration[]> {
        return this.http.get<TravelDuration[]>(`${this.baseUrl}/travel/durations`);
    }

    getRatesByDuration(durationId: number): Observable<TravelRatesData[]> {
        return this.http.get<TravelRatesData[]>(`${this.baseUrl}/travel/rates/${durationId}`);
    }
}
