const express = require('express'),
      app = express(),
      http = require('http').Server(app),
      io = require('socket.io')(http);

      path = require('path')
      EventEmitter = require('events'),

      Twitter = require('twitter'),
      credentials = require('./credentials.js'),

      client = new Twitter(credentials),

      query = process.argv[2] || 'pms, tampons, mentrual, menstruating, cramps',

      util = require('util'),

      geocoder = require('geocoder');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(path.join(__dirname, 'public')));

http.listen(3000, function() {
  console.log('listening on 3000');
});

function TweetEmitter(){
  EventEmitter.call(this);
}

util.inherits(TweetEmitter, EventEmitter);

const tweetEmitter = new TweetEmitter();

tweetEmitter.on('tweet', function(tweet) {
  console.log(tweet)
  io.emit('tweet', tweet);
});

tweetEmitter.on('tweetList', function(list) {
  console.log(list)
  io.emit('tweetList', list);
});

const emitTweet = (tweet, coordinates) => {
 const tweetSmall = {
      id: tweet.id_str,
      user: tweet.user.screen_name,
      text: tweet.text,
      placeName: tweet.user.location,
      latLong: coordinates,
    }
  tweetEmitter.emit('tweet', tweetSmall);
}

client.stream('statuses/filter', {track: query, language: 'en'}, (stream) => {
  stream.on('data', (tweet) => {
    console.log()
    if(tweet.user.location != null) {
      const coordinates = geocoder.geocode(tweet.user.location, function ( err, data ) {
        if (data.status !== 'ZERO_RESULTS'){
          emitTweet(tweet, [data.results[0].geometry.location.lng, data.results[0].geometry.location.lat])
        } 
      });      
    } else {
      emitTweet(tweet, [ 26.3346979, -80.881233 ])
    }
  });
});

const searchQuery = {
  q: '#pms', 
  lang: 'en', 
  result_type: 'mixed',
  count: 10
}

client.get('search/tweets', searchQuery, (error, tweets, response) => {
  const topTweets = tweets.statuses
  tweetEmitter.emit('tweetList', topTweets);
  console.log('top tweets')
});





