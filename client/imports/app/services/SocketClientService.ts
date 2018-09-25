// import * as Rx from 'rxjs';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import * as io from 'socket.io-client';
// import io from 'socket.io-client';
import { Injectable, NgZone } from "@angular/core";
import { Meteor } from "meteor/meteor";

@Injectable()
export class SocketClientService {
    constructor(private _ngZone: NgZone) {};

    private endpoint = Meteor.settings.public.SOCKET_SERVICE_URL;
    private socket={};

    reactiveConnectionStatus: Subject<Object> = new Subject<Object>();

    connect() {
        if (this.socket.connected) {
            this.reactiveConnectionStatus.next({connected: true, error: null});
        }
        else {
            //this.reactiveConnectionStatus.next({connected: false, error: null});
            this.socket = io(this.endpoint);
        }
    }

    init() {
        this.connect();


        this._ngZone.run(() => {

            this.socket.on('connect', () => {
                this.reactiveConnectionStatus.next({connected: true, error: null});
            });

            this.socket.on('reconnect', () => {
                this.reactiveConnectionStatus.next({connected: true, error: null});
            });


            this.socket.on('disconnect', () => {
                this.reactiveConnectionStatus.next({connected: false, error: null});
            });

            this.socket.on('error', (err) => {
                this.reactiveConnectionStatus.next({connected: this.socket.connected, error: err});
            });
        });
    }

    /**
     * 
     * @param messageType 
     * @param data 
     */
    send(messageType: string, data: any) {
        this.socket.emit('message', {type: messageType, payload: data});
    }

    /* The stream of messages received by the socket, as an observable *
     * Subscriber should filter by data.type
     */
    getInputStream(): Observable<T> {
        let received = new Observable(observer => {

            /*
            if (!this.socket.connected)
                this.connect();
            */
                this.socket.on('message', (data) => {
                    this._ngZone.run(() => {
                        console.log("-----socket message received, type:" + data.type);
                        observer.next(data);
                });
            });

            /*
            return () => {
                this.socket.disconnect();
            }*/
        });
        return received;
    }

    getFilteredStream(messageType: string) {
        return this.getInputStream().filter(x => x.type == messageType);
    }

    getReactiveConnectionStatus() {
        return this.reactiveConnectionStatus;
    }
}