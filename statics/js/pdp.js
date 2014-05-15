$(document).ready(function ($) {

    var argos = argos || {};
    argos.pdp = argos.pdp || {};

    argos.pdp.preview = new (function () {

        var search;
        var lastSelectedItem;
        var currentItem;
        var previewTemplate;

        function init() {
            previewTemplate = Handlebars.compile( $('template#pdpTemplate').html() );
            $("#results").on("click", ".searchResultBox", searchResultItemClickedHandler);
            search = $('#search');
        }

        function searchResultItemClickedHandler (event) {

            if (currentItem!=undefined) {
                stopScroll();
                lastSelectedItem = currentItem;
            }

            currentItem = $(this).parent(".searchResultBoxContainer");
            var isSameItem = currentItem.is(lastSelectedItem);
            var isDifferentRow = isSelectedProductOnDifferentRow(currentItem,lastSelectedItem);
            var scrollTop = calculateScrollTop(currentItem, lastSelectedItem);

            if (isDifferentRow) {
                showProductPreview(true);
            }
            else {
                if (!currentItem.is(lastSelectedItem)) {
                    showProductPreview(false);
                }
                else {
                    collapseProductPreview(currentItem, true);
                }
            }

            $('html, body').animate({scrollTop: scrollTop}, 350, function (event) {
                //have to add "html,body" for firefox/chrome/IE. Stop this getting called twice
                stopScroll();
                if ((hasPreviousPreview() && isDifferentRow) || isSameItem) {
                    removeProductPreview(lastSelectedItem);
                }
                lastSelectedItem =  isSameItem ? undefined : currentItem;
                currentItem = undefined;
            });
        }

        function hasPreviousPreview() {
            return lastSelectedItem != undefined;
        }

        function stopScroll() {
            $('html, body').stop( true, false );
        }

        function calculateScrollTop(currentProduct, lastProduct) {
            var scrollTop = currentProduct.offset().top;
            if (hasPreviousPreview()) {
                if(currentProduct.offset().top > lastProduct.offset().top) {

                    scrollTop -= lastProduct.find(".pdp")
                                            .outerHeight(true);
                }
            }

            return scrollTop - search.height();
        }

        function isSelectedProductOnDifferentRow(currentProduct, lastProduct) {
            return !hasPreviousPreview() || (currentProduct.offset().top!=lastProduct.offset().top);
        }

        function showProductPreview(withAnim) {
            expandProductPreview(currentItem, withAnim);
            collapseProductPreview(lastSelectedItem, withAnim);
        }

        function removeProductPreview(product) {
            resetResultBoxContainer(product)
                .find(".pdp")
                .remove();
        }

        function expandProductPreview(product, withAnim) {
            resetResultBoxContainer(product)
            setPreviewData(product)
                .addClass("searchResultBoxExpand" + (withAnim ? "" : " skipAnim"))
                .redraw()
                .find(".pdp")
                .removeClass("hide skipAnim")
                .addClass("show" + (withAnim ? "" : " skipAnim"))
                .redraw();
         }

        function collapseProductPreview(product, withAnim) {
            if (withAnim) {
                resetResultBoxContainer(product)
                    .addClass("searchResultBoxCollapse")
                    .redraw()
                    .find(".pdp")
                    .removeClass("show skipAnim")
                    .addClass("hide")
                    .redraw();
            }
            else {
                removeProductPreview(product);
            }
        }

        //TODO: get correct 1data / data correctly (curently hacked)
        function setPreviewData(product) {
            var productDetails = {};
            productDetails.title = product.find("h3").text();
            productDetails.imgUrl =  product.find("img").data("src");
            productDetails.price = product.find(".price").text().trim();
            productDetails.description = product.find(".searchResultBox").data("summarytext");
            var template = $(previewTemplate(productDetails));

            var cloned = template.clone();
            cloned.appendTo(product);
            return product;
        }

        function resetResultBoxContainer(product) {
            return $(product).removeClass("searchResultBoxCollapse searchResultBoxExpand skipAnim");
        }

        init();

    })();
});