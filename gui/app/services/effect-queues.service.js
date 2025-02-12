"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("effectQueuesService", function(backendCommunicator, utilityService,
            objectCopyHelper, ngToast) {
            const service = {};

            service.effectQueues = [];

            const updateEffectQueue = (effectQueue) => {
                const index = service.effectQueues.findIndex(eq => eq.id === effectQueue.id);
                if (index > -1) {
                    service.effectQueues[index] = effectQueue;
                } else {
                    service.effectQueues.push(effectQueue);
                }
            };

            service.loadEffectQueues = async () => {
                const effectQueues = await backendCommunicator.fireEventAsync("getEffectQueues");
                if (effectQueues != null) {
                    service.effectQueues = effectQueues;
                }
            };

            backendCommunicator.on("all-queues", effectQueues => {
                if (effectQueues != null) {
                    service.effectQueues = effectQueues;
                }
            });

            service.queueModes = [
                {
                    id: "custom",
                    display: "Custom",
                    description: "Wait the custom amount of time defined for each individual effect list.",
                    iconClass: "fa-clock"
                },
                {
                    id: "auto",
                    display: "Delay",
                    description: "Requires a 'Delay Effect' to be present to have any effect.",
                    iconClass: "fa-hourglass-half"
                },
                {
                    id: "interval",
                    display: "Interval",
                    description: "Runs effect lists on a set interval.",
                    iconClass: "fa-stopwatch"
                }
            ];

            service.getEffectQueues = () => {
                return service.effectQueues;
            };

            service.getEffectQueue = (id) => {
                return service.effectQueues.find(eq => eq.id === id);
            };

            service.saveEffectQueue = async (effectQueue) => {
                const savedEffectQueue = await backendCommunicator.fireEventAsync("saveEffectQueue", effectQueue);

                if (savedEffectQueue != null) {
                    updateEffectQueue(savedEffectQueue);

                    return true;
                }

                return false;
            };

            service.saveAllEffectQueues = (effectQueues) => {
                service.effectQueues = effectQueues;
                backendCommunicator.fireEvent("saveAllEffectQueues", effectQueues);
            };

            service.effectQueueNameExists = (name) => {
                return service.effectQueues.some(eq => eq.name === name);
            };

            service.duplicateEffectQueue = (effectQueueId) => {
                const effectQueue = service.effectQueues.find(eq => eq.id === effectQueueId);
                if (effectQueue == null) {
                    return;
                }

                const copiedEffectQueue = objectCopyHelper.copyObject("effect_queue", effectQueue);
                copiedEffectQueue.id = null;

                while (service.effectQueueNameExists(copiedEffectQueue.name)) {
                    copiedEffectQueue.name += " copy";
                }

                service.saveEffectQueue(copiedEffectQueue).then(successful => {
                    if (successful) {
                        ngToast.create({
                            className: 'success',
                            content: 'Successfully duplicated an effect queue!'
                        });
                    } else {
                        ngToast.create("Unable to duplicate effect queue.");
                    }
                });
            };

            service.deleteEffectQueue = (effectQueueId) => {
                service.effectQueues = service.effectQueues.filter(eq => eq.id !== effectQueueId);
                backendCommunicator.fireEvent("deleteEffectQueue", effectQueueId);
            };

            service.showAddEditEffectQueueModal = (effectQueueId) => {
                return new Promise(resolve => {
                    let effectQueue;

                    if (effectQueueId != null) {
                        effectQueue = service.getEffectQueue(effectQueueId);
                    }

                    utilityService.showModal({
                        component: "addOrEditEffectQueueModal",
                        size: "sm",
                        resolveObj: {
                            effectQueue: () => effectQueue
                        },
                        closeCallback: response => {
                            resolve(response.effectQueue.id);
                        }
                    });
                });
            };

            service.showDeleteEffectQueueModal = (effectQueueId) => {
                return new Promise(resolve => {
                    if (effectQueueId == null) {
                        resolve(false);
                    }

                    const queue = service.getEffectQueue(effectQueueId);
                    if (queue == null) {
                        resolve(false);
                    }

                    return utilityService
                        .showConfirmationModal({
                            title: "Delete Effect Queue",
                            question: `Are you sure you want to delete the effect queue "${queue.name}"?`,
                            confirmLabel: "Delete",
                            confirmBtnType: "btn-danger"
                        })
                        .then(confirmed => {
                            if (confirmed) {
                                service.deleteEffectQueue(effectQueueId);
                            }

                            resolve(confirmed);
                        });
                });
            };

            return service;
        });
}());