/* @odoo-module */

import { Record } from "@mail/core/common/record";

import { _t } from "@web/core/l10n/translation";

let nextId = 1;
export class NotificationGroup extends Record {
    static id = "id";
    /** @type {Object.<number, import("models").NotificationGroup>} */
    static records = {};
    /** @returns {import("models").NotificationGroup} */
    static new(data) {
        return super.new(data);
    }
    /** @returns {import("models").NotificationGroup} */
    static get(data) {
        return super.get(data);
    }
    /**
     * @param {Object} data
     * @returns {import("models").NotificationGroup}
     */
    static insert(data) {
        let group = this.store.discuss.notificationGroups.find((group) => {
            return (
                group.resModel === data.resModel &&
                group.type === data.type &&
                (group.resModel !== "discuss.channel" || group.resIds.has(data.resId))
            );
        });
        if (!group) {
            const id = nextId++;
            group = this.new({ id });
            Object.assign(group, { id });
            this.store.discuss.notificationGroups.add(group);
        }
        group.update(data);
        if (group.notifications.length === 0) {
            group.delete();
        }
        return group;
    }

    update(data) {
        Object.assign(this, {
            modelName: data.modelName ?? this.modelName,
            resModel: data.resModel ?? this.resModel,
            type: data.type ?? this.type,
            status: data.status ?? this.status,
        });
        const notifications = data.notifications ?? [];
        const alreadyKnownNotifications = new Set(this.notifications.map(({ id }) => id));
        const notificationIdsToRemove = new Set();
        for (const [commandName, notification] of notifications) {
            if (commandName === "ADD" && !alreadyKnownNotifications.has(notification.id)) {
                this.notifications.push(notification);
            } else if (commandName === "DELETE") {
                notificationIdsToRemove.add(notification.id);
            }
        }
        this.notifications = this.notifications.filter(
            ({ id }) => !notificationIdsToRemove.has(id)
        );
        this.lastMessage = this.notifications[0]?.message;
        for (const notification of this.notifications) {
            if (this.lastMessage?.id < notification.message?.id) {
                this.lastMessage = notification.message;
            }
        }
        this.resIds.add(data.resId);
    }

    notifications = Record.many("Notification");
    /** @type {string} */
    modelName;
    /** @type {string} */
    resModel;
    lastMessage = Record.one("Message");
    /** @type {Set<number>} */
    resIds = new Set();
    /** @type {'sms' | 'email'} */
    type;

    get iconSrc() {
        return "/mail/static/src/img/smiley/mailfailure.jpg";
    }

    get body() {
        return _t("An error occurred when sending an email");
    }

    get datetime() {
        return this.lastMessage?.datetime;
    }
}

NotificationGroup.register();
