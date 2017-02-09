var contriblyGalleryjQuery = $.noConflict();
  contriblyUnderscore = _.noConflict(),
  assignmentUrl = '';

function contriblyInitGallery(span) {

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

  infiniteScroll.initialize();

}

var contriblyGalleryPageSize = 12;

var infiniteScroll = {
  data: {
    lastContributionDate: null
  },
  initialize: function() {
    document.addEventListener("scroll", this.handleScroll);
    this.loadData(assignmentUrl);
  },
  handleScroll: function() {
   if (document.getElementsByTagName("body")[0].scrollTop + window.innerHeight >= document.getElementsByTagName("body")[0].scrollHeight) {
    infiniteScroll.loadData(assignmentUrl);
   }
  },
  loadData: function(assignmentUrl) {
    contriblyGalleryjQuery.ajax({
      type: 'GET',
      url: assignmentUrl + "&pageSize=" + contriblyGalleryPageSize + (infiniteScroll.data.lastContributionDate ? "&createdBefore=" + infiniteScroll.data.lastContributionDate : ""),
      success: function(contributions) {

        contriblyGalleryjQuery(contributions).each(function(index, contribution) {

          function galleryItemFor(contribution) {

            var hasMedia = contribution.mediaUsages.length > 0;
            if (hasMedia) {

                function artifactUrlFor(mediaUsage, artifactFormat) {
                    var artifact = contriblyUnderscore.find(mediaUsage.artifacts, function(artifact) {
                        return artifact.label == artifactFormat && artifact.url != undefined;
                    });
                    return artifact != null ? artifact.url : null;
                }

                thumbnail = artifactUrlFor(contribution.mediaUsages[0], "medium");
                fullsizeImage = artifactUrlFor(contribution.mediaUsages[0], "extralarge");

                headline = contribution.headline;
                body = contribution.body;
                author = contribution.attribution;

                var placeName = (contribution.place && contribution.place.name) ? contribution.place.name : ""; // TODO shows that the next block needs to be an append

                var galleryListItem = contriblyGalleryjQuery("<li>", {class: "list-item"});

                var aTag = contriblyGalleryjQuery("<a>", {
                    href: fullsizeImage,
                    rel: "contri-gal",
                    class: "list-content fancybox",
                    title: headline,
                    "data-author": author,
                    "data-body": body,
                    "data-created": contribution.created,
                    "data-place": placeName
                    }
                );

                aTag.append(contriblyGalleryjQuery("<img>", {src: thumbnail}));
                aTag.append(contriblyGalleryjQuery("<h3>").text(headline));

                galleryListItem.append(aTag);

                var holder = contriblyGalleryjQuery("<div>");
                holder.append(galleryListItem);
                return holder.html();


            } else {
                return "TODO - support text only contributions";
            }

          }

          var galleryItem = galleryItemFor(contribution);

          contriblyGalleryjQuery('.list').append(galleryItem);
          contriblyGalleryjQuery('.fancybox').fancybox({
            afterLoad: function() {
              var attribution = contriblyGalleryjQuery(this.element).data("author");
              var created = contriblyGalleryjQuery(this.element).data("created");
              var place = contriblyGalleryjQuery(this.element).data("place");

              if (contriblyGalleryjQuery(this.element).data("body") !== undefined) {
                var itemBody = contriblyGalleryjQuery(this.element).data("body");
              }

              var titleDiv = contriblyGalleryjQuery("<div>");

              var attributesBar = contriblyGalleryjQuery('<ul>', {class: "attributes"});
              attributesBar.append(contriblyGalleryjQuery("<li>", {class: "attribution"}).text(attribution));
              var formattedCreatedDate = contriblyGalleryjQuery.format.date(created, "d MMMM yyyy")
              attributesBar.append(contriblyGalleryjQuery("<li>", {class: "created"}).text(formattedCreatedDate));
              if (place) {
                attributesBar.append(contriblyGalleryjQuery("<li>", {class: "place"}).text(place));
              }
              titleDiv.append(attributesBar);

              titleDiv.append(contriblyGalleryjQuery("<h2>").text(this.title));
              if (itemBody) {
                titleDiv.append(contriblyGalleryjQuery("<span>", {class: "body"}).text(itemBody));
              }

              this.title = titleDiv.html();
            },
            helpers: {
              title: {
                type: 'inside'
              }
            }
          });

          infiniteScroll.data.lastContributionDate = contribution.created;
        });
      }
    });

  }
}

document.addEventListener("DOMContentLoaded", function() {
  contriblyGalleryjQuery.ajax({
    url: "https://s3-eu-west-1.amazonaws.com/contribly-widgets/gallery/gallery2017012801-SNAPSHOT.css",
    success: function(data) {
      contriblyGalleryjQuery("head").append("<style>" + data + "</style>");
      contriblyGalleryjQuery('.contribly-gallery').each(function(i, v) {
        contriblyInitGallery(contriblyGalleryjQuery(v));
      });
    }
  });
})
