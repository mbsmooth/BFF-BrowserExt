const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

window.addEventListener('load', (event) => {
    JsBarcode("#barcode", urlParams.get('order'));
});



