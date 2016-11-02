var width = window.innerWidth,
    height = window.innerHeight;

var projection = d3.geo.orthographic()
    .translate([width/2, height/3])
    .scale(width / 2 )
    .clipAngle(90)
    .precision(1);

var canvas = d3.select("#tweet-map").append("canvas")
    .attr("width", width)
    .attr("height", height);

var c = canvas.node().getContext("2d");

var path = d3.geo.path()
    .projection(projection)
    .context(c);

queue()
    .defer(d3.json, "/world-110m.json")
    .defer(d3.tsv, "/world-country-names.tsv")
    .await(ready);

function ready(error, world, names) {
  if (error) throw error;

  var globe = {type: "Sphere"},
      land = topojson.feature(world, world.objects.land),
      countries = topojson.feature(world, world.objects.countries).features,
      borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; });

  countries = countries.filter(function(d) {
    return names.some(function(n) {
      if (d.id == n.id) return d.name = n.name;
    });
  }).sort(function(a, b) {
    return a.name.localeCompare(b.name);
  });

  d3.transition()
      .duration(1250)
      .tween("rotate", function() {
        var p = [138.2529, 36.2048]
            r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
        return function(t) {
          projection.rotate(r(t));
          c.clearRect(0, 0, width, height);
          c.fillStyle = "#E58176", c.beginPath(), path(land), c.fill();
          c.strokeStyle = "#fee7e5", c.lineWidth = 1, c.beginPath(), path(borders), c.stroke();
        };
      });

  var socket = io({ "force new connection" : true });

  function makeHTML(tweet) {
    return [
      '<div class="tweet">',
      '<h1>', tweet.placeName, '</h1>',
      '<a class="user" href="https://twitter.com/', tweet.user, '" target="_blank">', '@', tweet.user, ':</a><br/>',
      '<a class="text" href="https://twitter.com/', tweet.user, '/status/', tweet.id, '" target="_blank">',
      tweet.text, '</a>', '</div></div>'
    ].join('');
  }

  function removeCSSLoader() {
    var el = document.getElementById('loader');
    if(el) {
      el.className += el.className ? ' invisible' : 'invisible';
    }
  }

  var title = d3.select(".title");

  socket.on('tweet', function(tweet) {
    addTopTweets(tweet)
    removeCSSLoader()
    d3.transition()
      .duration(1250)
      .each("start", function() {
        title.html(makeHTML(tweet));
      })
      .tween("rotate", function() {
        var p = tweet.latLong,
            r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
        return function(t) {
          projection.rotate(r(t));
          c.clearRect(0, 0, width, height);
          c.fillStyle = "#E58176", c.beginPath(), path(land), c.fill();
          c.strokeStyle = "#fff", c.lineWidth = .5, c.beginPath(), path(borders), c.stroke();
          var center = projection(p);
          c.strokeStyle = "#D84315", c.fillStyle = "#D84315", c.beginPath(), c.arc(center[0], center[1], 5, 0, 2 * Math.PI, false), c.lineWidth = 3, c.fill(), c.stroke();
        };
      });
  });

  function addTopTweets (tweet) { 
    var tweetList = document.getElementById("tweetList"); 
    var div = document.createElement("div"); 
    var tweetText = document.createElement('a'); 
    tweetText.href = 'http://twitter.com/' + tweet.user + '/status/' + tweet.id,
    tweetText.innerHTML = '<strong>@' +tweet.user + ': </strong>' + tweet.text
    div.appendChild(tweetText);
    tweetList.appendChild(div); 
  }

  socket.on('tweetList', (list) => {
    console.log('received signal')
    list.map((list) =>  {
      addTopTweets(list)
    })
  });
}

d3.select(self.frameElement).style("height", height + "px");

function showAbout() {
  document.getElementById("about-div").style.visibility = 'visible';
}

function closeAbout() {
  console.log('close');
  document.getElementById("about-div").style.visibility = 'hidden';
}