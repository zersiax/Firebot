"use strict";

(function() {
    angular.module("firebotApp").component("navLink", {
        bindings: {
            name: "@",
            page: "@",
            icon: "@",
            isIndex: "<",
            badgeText: "<"
        },
        template: `
            <li>
                <a draggable=false class="fb-nav-link" href="{{$ctrl.href}}" ng-class="{'selected': $ctrl.sbm.tabIsSelected($ctrl.page)}" ng-click="$ctrl.sbm.setTab($ctrl.page, $ctrl.name)"  uib-tooltip="{{!$ctrl.sbm.navExpanded ? $ctrl.name : ''}}" tooltip-placement="right" tooltip-append-to-body="true">
                    <div class="nav-link-bar"></div>
                    <div class="nav-link-icon">
                    <span class="nav-icon-wrapper">
                        <i ng-class="$ctrl.getClass()"></i>
                    </span>
                    </div>
                    <div class="nav-link-title" ng-class="{'contracted': !$ctrl.sbm.navExpanded}">{{$ctrl.name}}</div>
                    <div ng-show="$ctrl.hasBadge" class="nav-update-badge" ng-class="{'contracted': !$ctrl.sbm.navExpanded}">
                        <span class="label label-danger">{{$ctrl.badgeText}}</span>
                    </div>
                </a>
            </li>
            `,
        controller: function(sidebarManager) {
            const ctrl = this;

            ctrl.sbm = sidebarManager;

            ctrl.$onInit = function() {
                ctrl.hasBadge = ctrl.badgeText != null && ctrl.badgeText !== "";
                ctrl.href = ctrl.isIndex
                    ? "#"
                    : "#!" + ctrl.page.toLowerCase().replace(/\W/g, "-");
            };

            ctrl.getClass = function() {
                const isSelected = sidebarManager.tabIsSelected(ctrl.page);
                return `${isSelected ? "fad" : "fal"} ${ctrl.icon}`;
            };
        }
    });
}());
