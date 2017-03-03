var contriblyGalleryjQuery = $.noConflict();
  contriblyUnderscore = _.noConflict(),
  assignmentUrl = '';

function contriblyInitGallery(span) {

  function publishContriblyEvent(ce) {
        if (typeof contriblyEventListener === "function") {
            ce['widget'] = 'gallery';
            contriblyEventListener(ce);
        }
    }

  var overrideContriblyApi = span.attr('data-api');
  contriblyApi = (overrideContriblyApi) ? overrideContriblyApi : "https://api.contribly.com/1",
  requestedAssignment = span.attr('data-assignment'),
  assignmentUrl = contriblyApi + "/contributions?assignment=" + requestedAssignment + "&mediaType=image";

  var widget = contriblyGalleryjQuery('<div>', {class: "gallery"});

  var galleryHead = '<header class="gallery-head">' +
    '<h1></h1>' +
    '<div class="description"></div>' +
    '<div class="contributionCount"></div>' +
    '</header>';
  widget.append(galleryHead);

  contriblyGalleryjQuery.ajax({
    type: 'GET',
    url: contriblyApi + "/assignments/" + requestedAssignment,
    success: function(assignment) {
        contriblyGalleryjQuery('.gallery-head h1').html(assignment.name);
        contriblyGalleryjQuery('.gallery-head .description').html(assignment.description);
    }
  });

  contriblyGalleryjQuery.ajax({
      type: 'HEAD',
      url: contriblyApi + "/contributions?assignment=" + requestedAssignment,
      success: function(data, textStatus, jqXHR) {
        var totalCount = jqXHR.getResponseHeader("X-Total-Count");
        contriblyGalleryjQuery('.gallery-head .contributionCount').html(totalCount + ' contributions');
      }
  });

  var wrapper = contriblyGalleryjQuery('<div>', {class: "contribly"});
  widget.append('<ul id="gallery-list" class="list"></ul>');
  wrapper.append(widget);
  span.append(wrapper);

  contriblyGalleryjQuery('.list').isotope({
      itemSelector: '.list-item',
      layoutMode: 'masonry'
  });

  infiniteScroll.initialize();

  publishContriblyEvent({type: "loaded"})
}

var contriblyGalleryPageSize = 12;

var infiniteScroll = {
  data: {
     lastContributionDate: new Date().toISOString(),
     lastLoad: null
  },
  initialize: function() {
    document.addEventListener("scroll", this.handleScroll);
    this.loadData(assignmentUrl);
  },
  handleScroll: function() {
    var bodyElement = document.getElementsByTagName("body")[0];
    var bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    var bottomOfView = bodyScrollTop + window.innerHeight;
    var needToLoadMore = bottomOfView >= bodyElement.scrollHeight;
    if (needToLoadMore) {
        infiniteScroll.loadData(assignmentUrl);
    }
  },
  loadData: function(assignmentUrl) {
    var alreadyInflight = infiniteScroll.data.lastContributionDate == infiniteScroll.data.lastLoad;
    if(alreadyInflight) {
        return;
    }
    infiniteScroll.data.lastLoad = infiniteScroll.data.lastContributionDate;

    var ajaxUrl = assignmentUrl + "&pageSize=" + contriblyGalleryPageSize + (infiniteScroll.data.lastContributionDate ? "&createdBefore=" + infiniteScroll.data.lastContributionDate : "");
    contriblyGalleryjQuery.ajax({
      type: 'GET',
      url: ajaxUrl,
      success: function(contributions) {

        function attributesBarFor(attribution, created, place) {
          var attributesBar = contriblyGalleryjQuery('<ul>', {class: "attributes"});
          attributesBar.append(contriblyGalleryjQuery("<li>", {class: "attribution"}).text(attribution));
          var formattedCreatedDate = contriblyGalleryjQuery.format.date(created, "d MMMM yyyy")
          attributesBar.append(contriblyGalleryjQuery("<li>", {class: "created"}).text(formattedCreatedDate));
          if (place) {
            attributesBar.append(contriblyGalleryjQuery("<li>", {class: "place"}).text(place));
          }
          return attributesBar;
        }

        contriblyGalleryjQuery(contributions).each(function(index, contribution) {

          function galleryItemFor(contribution) {

            var hasMedia = contribution.mediaUsages.length > 0;
            if (hasMedia) {

                function artifactWithUrlFor(mediaUsage, artifactFormat) {
                    return contriblyUnderscore.find(mediaUsage.artifacts, function(artifact) {
                        return artifact.label == artifactFormat && artifact.url != undefined;
                    });
                }

                thumbnailArtifact = artifactWithUrlFor(contribution.mediaUsages[0], "mediumoriginalaspectdouble");
                fullsizeArtifact = artifactWithUrlFor(contribution.mediaUsages[0], "extralarge");

                headline = contribution.headline;
                body = contribution.body;
                author = contribution.attribution;

                var placeName = (contribution.place && contribution.place.name) ? contribution.place.name : ""; // TODO shows that the next block needs to be an append

                var aTag = contriblyGalleryjQuery("<a>", {
                    href: fullsizeArtifact != null ? fullsizeArtifact.url : null,
                    rel: "contri-gal",
                    class: "list-content fancybox",
                    title: headline,
                    "data-author": author,
                    "data-body": body,
                    "data-created": contribution.created,
                    "data-place": placeName
                    }
                );

                if (thumbnailArtifact) {
                    aTag.append(contriblyGalleryjQuery("<img>", {src: thumbnailArtifact.url}).attr("width", thumbnailArtifact.width).attr("height", thumbnailArtifact.height));
                }
                aTag.append(contriblyGalleryjQuery("<h3>").text(headline));
                aTag.append(attributesBarFor(author, contribution.created, placeName));

                var galleryListItem = contriblyGalleryjQuery("<div>", {class: "list-item"});
                galleryListItem.append(aTag);

                return galleryListItem;

            } else {
                return "TODO - support text only contributions";
            }

          }

          var galleryItemForContribution = galleryItemFor(contribution);
          contriblyGalleryjQuery('.list').isotope('insert', galleryItemForContribution);

          contriblyGalleryjQuery('.fancybox').fancybox({    // TODO Is this in the right place?
            afterLoad: function() {
              var attribution = contriblyGalleryjQuery(this.element).data("author");
              var created = contriblyGalleryjQuery(this.element).data("created");
              var place = contriblyGalleryjQuery(this.element).data("place");

              if (contriblyGalleryjQuery(this.element).data("body") !== undefined) {
                var itemBody = contriblyGalleryjQuery(this.element).data("body");
              }

              var titleDiv = contriblyGalleryjQuery("<div>");

              titleDiv.append(attributesBarFor(attribution, created, place));

              titleDiv.append(contriblyGalleryjQuery("<h2>").text(this.title));
              if (itemBody) {
                titleDiv.append(contriblyGalleryjQuery("<span>", {class: "body"}).text(itemBody));
              }

              var inner = contriblyGalleryjQuery("<div>", {class: "gallery"});
              inner.append(titleDiv);
              var wrapper = contriblyGalleryjQuery('<div>', {class: "contribly"});
              wrapper.append(inner);

              var holder = contriblyGalleryjQuery("<div>");
              holder.append(wrapper);
              this.title = holder.html();
            },
            helpers: {
              title: {
                type: 'inside'
              }
            }
          });

          infiniteScroll.data.lastContributionDate = contribution.created;
        });

        contriblyGalleryjQuery('.list').imagesLoaded().always(function(instance) {
            contriblyGalleryjQuery(".list").isotope('layout');
        });

      }
    });

  }
}

document.addEventListener("DOMContentLoaded", function() {
    contriblyGalleryjQuery('.contribly-gallery').each(function(i, v) {
        var requestedCss = contriblyGalleryjQuery.attr('data-css');
        var cssToLoad = (requestedCss != undefined) ? requestedCss : "https://s3-eu-west-1.amazonaws.com/contribly-widgets/gallery/gallery2017021501.css";
        contriblyGalleryjQuery.ajax({
            url: cssToLoad,
            success: function(data) {
                contriblyGalleryjQuery("head").append("<style>" + data + "</style>");
                contriblyInitGallery(contriblyGalleryjQuery(v));
            }
        });
    });
})
