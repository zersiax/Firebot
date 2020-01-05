"use strict";
const EventEmitter = require("events");
const io = require("socket.io-client");
const request = require("request");
const slEventHandler = require("./events/streamlabs-event-handler");
const slVariableLoader = require("./variables/streamlabs-variable-loader");

const integrationDefinition = {
    id: "streamlabs",
    name: "Streamlabs",
    description: "Donation and Extra Life Donation events",
    linkType: "auth",
    authProviderDetails: {
        id: "streamlabs",
        name: "StreamLabs Account",
        client: {
            id: 'XtzRXbIUU9OZcU3siwNBXOSVFD8DGjYhkLmeUqYQ',
            secret: "pJMm1ktVgtXkNEdhU5HIowQNCLxZyMLin0yu0q6b"
        },
        auth: {
            tokenHost: 'https://streamlabs.com',
            tokenPath: '/api/v1.0/token',
            authorizePath: '/api/v1.0/authorize'
        },
        scopes: 'donations.read socket.token'
    }
};

function getStreamlabsSocketToken(accessToken) {
    return new Promise((res, rej) => {
        let options = {
            method: "GET",
            url: "https://streamlabs.com/api/v1.0/socket/token",
            qs: { access_token: accessToken } //eslint-disable-line camelcase
        };

        request(options, function(error, response, body) {
            if (error) return rej(error);

            body = JSON.parse(body);

            console.log(body.socket_token);
            res(body.socket_token);
        });
    });
}

class StreamlabsIntegration extends EventEmitter {
    constructor() {
        super();
        this.connected = false;
        this._socket = null;
    }
    init() {
        slEventHandler.registerEvents();
        slVariableLoader.registerVariables();
    }
    connect(integrationData) {
        let { settings } = integrationData;

        if (settings == null) {
            this.emit("disconnected", integrationDefinition.id);
            return;
        }

        this._socket = io(
            `https://sockets.streamlabs.com?token=${settings.socketToken}`,
            {
                transports: ["websocket"]
            }
        );

        this._socket.on("event", eventData => {
            slEventHandler.processStreamLabsEvent(eventData);
        });

        this.emit("connected", integrationDefinition.id);
        this.connected = true;
    }
    disconnect() {
        this._socket.close();
        this.connected = false;

        this.emit("disconnected", integrationDefinition.id);
    }
    async link(linkData) {
        let { auth } = linkData;

        let settings = {};
        try {
            settings.socketToken = await getStreamlabsSocketToken(auth['access_token']);
        } catch (error) {
            console.log(error);
            return;
        }

        this.emit("settings-update", integrationDefinition.id, settings);
    }
    unlink() {
        this._socket.close();
    }
}

module.exports = {
    definition: integrationDefinition,
    integration: new StreamlabsIntegration()
};