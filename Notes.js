OpenWindow = window.OpenWindow = (obj) => {
    var that = this;
    console.log(JSON.stringify(obj));
    //alert('OpenWindow');
    if (obj.hasOwnProperty("isIframe")) {
        if (obj.isIframe) {
            var method = obj.iframeMethod ? obj.iframeMethod : 'GET';
            var orderids = obj.orderids ? obj.orderids : '';
            GlobalService.setIframeUrl(obj.id,method,orderids);
        }
    }
    if (obj.singleton) { // if it is a singleton and exists we want to move it towards the front else if it does not exist we want to add it
        var FoundObject = '';
        var FoundIndex = '';
        if (obj.hasOwnProperty("isIframe")) {
            // We find tab using uniqName if it's iframe
            // Because all iframe have same url <report-iframe-component></report-iframe-component>
            // and if iframe is singlton(means open only one tab) than we need to check it's already open or not
            // IN case of Find order > Document > Edit Master Bol && Find Order > Document > Shipping manifest
            // We need to change logic for find object
            FoundObject = WmsWindow.FindObjectByProperty("uniqName", obj.uniqName); // get the object
            FoundIndex = WmsWindow.FindIndexByProperty("uniqName", obj.uniqName);
        } else {
            FoundObject = WmsWindow.FindObjectByProperty("url", obj.url); // get the object
            FoundIndex = WmsWindow.FindIndexByProperty("url", obj.url);
        }
        // REFACTOR what if we find multiple objects with the same url as singletons here, we should never have this happen but maybe good to put some checking in or conditions for this.
        if (FoundObject) {
            var urlParam = ''
            if (obj.urlParam) {
                urlParam += obj.urlParam;
                window.history.replaceState("object or string", "Title", `?page=${urlParam}`);
            }

            WmsWindow.ResetActiveStatus();
            var GetWindow = $("#" + FoundObject[0].Window);
            GetWindow.show();
            that.resizeAllGrid(200);
            WmsWindow.WindowData[FoundIndex].active = true; // The window was brought to the front so the thumbnails need to display the active class for the correct thumbnail
            that.setState({
                navThumbnailData: WmsWindow.WindowData
            });
            // for master pick ticket referece data if url change
            if (WmsWindow.WindowData[FoundIndex].id != obj.id && obj.reloadIframe) {
                WmsWindow.WindowData[FoundIndex].id = obj.id;
                $("#" + FoundObject[0].Window + ' .dynamic-react-component').find("iframe").attr({ "src": obj.id });
            }

            window.ChildBulletin.Data = obj;
            if (obj.sendToTab == "Location") {
                var receiptObj = obj.receiptObj;
                var event = new CustomEvent("showLocation", {
                    detail: {
                        receiptObj: receiptObj
                    }
                });
                document.dispatchEvent(event);
            } else if (obj.sendToTab == "Item") {
                var receiptObj = obj.receiptObj;
                var eventItem = new CustomEvent("showItem", {
                    detail: {
                        receiptObj: receiptObj
                    }
                });
                document.dispatchEvent(eventItem);
            }
        } else {
            WmsWindow.InsertWindow(obj);
        }

    } else if (obj.hasOwnProperty("id") && obj.id != 0) { // we want to see if order is already open
        var isNonSingletonEditAlreadyExists = WmsWindow.FindIndexByProperty("id", obj.id); // some non singletons for example editing should only have one edit of a certain id open at a time

        if (isNonSingletonEditAlreadyExists === -1) {

            var nextWindow = WmsWindow.NextAvailableWindow();
            // we dont care if this window already exists because it can have multiple instances, we just care if we have room in our window array

            if (nextWindow) {
                WmsWindow.InsertWindow(obj);
            }

        } else {

            var FoundObject2 = WmsWindow.FindObjectByProperty("id", obj.id); // get the object
            var FoundIndex2 = WmsWindow.FindIndexByProperty("id", obj.id);

            WmsWindow.ResetActiveStatus();
            var GetWindow = $("#" + FoundObject2[0].Window);
            GetWindow.show();
            that.resizeAllGrid(200);
            WmsWindow.WindowData[FoundIndex2].active = true; // The window was brought to the front so the thumbnails need to display the active class for the correct thumbnail

            that.setState({
                navThumbnailData: WmsWindow.WindowData
            });
            var urlParam = ''
            if (obj.urlParam) {
                urlParam += obj.urlParam;
                window.history.replaceState("object or string", "Title", `?page=${urlParam}`);
            }
        }
    } else { // if its not a singleton
        var nextWindow = WmsWindow.NextAvailableWindow();
        // we dont care if this window already exists because it can have multiple instances, we just care if we have room in our window array

        if (nextWindow) {
            WmsWindow.InsertWindow(obj);
        }

    }
}




openMessageAlertIframe = () => {
    this.OpenWindow({
        url: '<report-iframe-component></report-iframe-component>',
        reactComponent: reportIframe,
        singleton: false,
        id: '/WebUI/V1/V1Link/ClientMessagingView.aspx',
        isIframe: true,
        title: 'Label_Message_Title',
        active: true,
        useLineItem: false,
        lineItem: [{
            name: '',
            value: 'Label_Message_Title'
        }],
        icon: 'submenu-icon fa fa-commenting'
    })
}