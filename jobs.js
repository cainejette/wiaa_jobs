var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var nodemailer = require('nodemailer');

request('http://www.wiaa.com/Jobs.aspx', (err, response, body) => {
  if (!err) {
    // create cheerio object from seed html
    var $ = cheerio.load(body);
    
    var dates = [];
    var mixed = [];

    // grab table cells we care about  
    $('td[valign=top]').each(function(i, elem) {
      // dates are formatted differently from position and location tds
      elem.children.filter(child => child.name == 'a' && child.children[0].data).forEach(child => {
        dates.push(child.children[0].data); 
      });
    
      // positions and locations are in the same array here, so we separate later
      elem.children.filter(child => child.data && child.data.trim().length > 0).forEach(child => {
        mixed.push(child.data.trim());
      })
    });

    var positions = [];
    var locations = [];      
    mixed.forEach((item, index) => {
      index % 2 == 0 ? positions.push(item) : locations.push(item);
    })
    
    // populate our final array of objects
    var jobs = [];
    dates.forEach((date, index) => {
      jobs.push({
        'date': date,
        'position': positions[index],
        'location': locations[index]
      });
    });
    
    var volleyballJobs = jobs.filter(job => job.position.toLowerCase().includes('volleyball'));
    
    sendMail(volleyballJobs); 
  }
});

function sendMail(data) {
  var api_key = 'key-71f190d4fedc27d5a4f9e360f63a683f';
  var domain = 'sandbox1413bb43378145d3a42aac373b00569b.mailgun.org';
  var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
  
  var formatted = data.map(job => {
    return job.date + '\n' + job.position + '\n' + job.location + '\n\n'
  }).reduce((a,b) => a + b);
  
  var mail = {
    from: 'Caine <me@caine.jette>',
    to: 'hawaiianbrah@gmail.com',
    subject: 'Today\'s count: ' + data.length,
    text: formatted
  };
  
  mailgun.messages().send(mail, function (error, body) {
    console.log(body);
  });
}