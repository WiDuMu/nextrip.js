/// A helper for interacting with the Nextrip API for Metro Transit
/// API reference: https://svc.metrotransit.org/swagger/index.html

/**
 * Wraps the `fetch()` and `Response.json()` methods to wrap a single promise
 * Used due to a race condition found when caching with two awaits
 * @param url A valid url
 * @returns 
 */
async function fetchJSON(url: string | URL) {
   return fetch(url).then(response => response.json());
}

/**
 * A type representing the Nextrip v2 Route response type
 */
type Route = {
   route_id: string;
   agency_id: string;
   route_label: string;
}

export class Nextrip {
   api: string | URL;
   routeRequest?: Promise<any>;
   routes?: any; // Currently no typing stuff available.
   agencyRequest?: Promise<Response>;
   agencies?: any;
   directions: Record<string, Object>;
   directionsRequests: Record<string, Promise<any>>;
   stops: Record<string, Record<string, any>>;
   stopRequests: Record<string, Record<string, Promise<any>>>;

   constructor(url?: string | URL) {
      this.api = (url) ? url : `https://svc.metrotransit.org/nextrip`;
      this.directions = {};
      this.directionsRequests = {};
      this.stops = {};
      this.stopRequests = {};
   }

   async getRoutes() {
      if (this.routes) {
         return this.routes;
      }
      if (!this.routeRequest) {
         console.log(`sending request`);
         this.routeRequest = fetchJSON(`${this.api}/routes`); // To avoid triggering multiple trips to the api when asking for one
      }
      this.routes = await this.routeRequest;
      this.routeRequest = undefined;
      return this.routes;
   }

   async getAgencies() {
      if (this.agencies) {
         return this.agencies;
      }
      if (!this.agencyRequest) {
         console.log(`sending request`);
         this.agencyRequest = fetchJSON(`${this.api}/agencies`); // To avoid triggering multiple trips to the api when asking for one
      }
      this.agencies = await this.agencyRequest;
      this.agencyRequest = undefined;
      return this.agencies;
   }

   async getDirections(routeID: string) {
      if (routeID in this.directions) {
         return this.directions[routeID];
      }
      if (!(routeID in this.directionsRequests)) {
         console.log(`sending request`);
         this.directionsRequests[routeID] = fetchJSON(`${this.api}/directions/${routeID}`); // To avoid triggering multiple trips to the api when asking for one
      }
      this.directions[routeID] = await this.directionsRequests[routeID];
      delete this.directionsRequests[routeID];
      return this.directions[routeID];
   }

   async getStops(routeID: string, directionID: string) {
      if (routeID in this.stops && directionID in this.stops[routeID]) {
         return this.stops[routeID][directionID];
      }
      
      if (!(routeID in this.stops)) {
         this.stops[routeID] = {};
      }
      
      if (!(routeID in this.stopRequests))  {
         this.stopRequests[routeID] = {};
      }

      if (!(directionID in this.stopRequests[routeID])) {
         this.stopRequests[routeID][directionID] = fetchJSON(`${this.api}/stops/${routeID}/${directionID}`);
      }

      this.stops[routeID][directionID] = await this.stopRequests[routeID][directionID];
      return this.stops[routeID][directionID];
   }

   /**  
    * Get information about a location code, including it's location, id, name, alerts, and departures.
    * This will have less caching due to it's departure information being timely.
   */
   async getLocation(routeID: string, directionID: string, placeCode: string) {
      return fetchJSON(`${this.api}/${routeID}/${directionID}/${placeCode}`);
   }

   async getStop(stopID: string | number) {
      return fetchJSON(`${this.api}/${stopID}`);
   }

   /**
    * Get the current vehicles serving a route
    * @param routeID A valid Nextrip route ID
    * @returns 
    */
   async getVehicles(routeID: string | number): Promise<any> {
      return fetchJSON(`${this.api}/vehicles/${routeID}`);
   }
}