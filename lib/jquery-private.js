define(['require', 'jquery', 'isotope', 'imagesloaded', 'jquery-bridget', 'fancybox', 'jquery-dateFormat'], function (require, jQuery, Isotope, imagesLoaded, jQueryBridget, fancybox, jqueryDateFormat) {
    // Isotope
    jQueryBridget( 'isotope', Isotope, jQuery );

    // imagesloaded
    imagesLoaded.makeJQueryPlugin( jQuery );

    return jQuery.noConflict( true );
});