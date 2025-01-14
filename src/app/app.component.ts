import {Component, OnDestroy} from '@angular/core';
import {ConnectionStatus, MqttService, SubscriptionGrant} from './ngx-mqtt-client';
import {IClientOptions} from 'mqtt';

export interface Foo {
    bar: string;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {

    messages: Array<Foo> = [];

    status: Array<string> = [];

    constructor(private _mqttService: MqttService) {

        /**
         * Tracks connection status.
         */
        this._mqttService.status().subscribe((s: ConnectionStatus) => {
            const status = s === ConnectionStatus.CONNECTED ? 'CONNECTED' : 'DISCONNECTED';
            this.status.push(`Mqtt client connection status: ${status}`);
        });
    }

    /**
     * Manages connection manually.
     * If there is an active connection this will forcefully disconnect that first.
     * @param {IClientOptions} config
     */
    connect(config: IClientOptions): void {
        this._mqttService.connect(config);
    }

    /**
     * Subscribes to fooBar topic.
     * The first emitted value will be a {@see SubscriptionGrant} to confirm your subscription was successful.
     * After that the subscription will only emit new value if someone publishes into the fooBar topic.
     * */
    subscribe(): void {
        this._mqttService.subscribeTo<Foo>('moph')
            .subscribe({
                next: (msg: SubscriptionGrant | Foo) => {
                    if (msg instanceof SubscriptionGrant) {
                        this.status.push('Subscribed to moph topic!');
                    } else {
                        this.messages.push(msg);
                    }
                },
                error: (error: Error) => {
                    this.status.push(`Something went wrong: ${error.message}`);
                }
            });
    }


    /**
     * Sends message to fooBar topic.
     */
    sendMsg(): void {
        this._mqttService.publishTo<Foo>('moph', {bar: 'foo'}).subscribe({
            next: () => {
                this.status.push('Message sent to moph topic');
            },
            error: (error: Error) => {
                this.status.push(`Something went wrong: ${error.message}`);
            }
        });
    }

    /**
     * Unsubscribe from fooBar topic.
     */
    unsubscribe(): void {
        this._mqttService.unsubscribeFrom('moph').subscribe({
            next: () => {
                this.status.push('Unsubscribe from moph topic');
            },
            error: (error: Error) => {
                this.status.push(`Something went wrong: ${error.message}`);
            }
        });
    }

    /**
     * The purpose of this is, when the user leave the app we should cleanup our subscriptions
     * and close the connection with the broker
     */
    ngOnDestroy(): void {
        this._mqttService.end();
    }

}
