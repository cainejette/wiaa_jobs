var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var prependFile = require('prepend-file');

var lastRun;
try {
  lastRun = require('./last.json');
} catch (e) {
  lastRun = 'none';
}

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
    log(volleyballJobs.length + ' volleyball jobs found. Most recent: ' + JSON.stringify(volleyballJobs[0]));
    
    if (JSON.stringify(volleyballJobs) !== JSON.stringify(lastRun)) {
      if (lastRun !== 'none') {
        fs.unlinkSync('./last.json');  
      }
        
      fs.writeFileSync('./last.json', JSON.stringify(volleyballJobs));
      log('Updated last.json');  
    }
  }
});

function log(msg) {
  fs.appendFile('./log.txt', new Date() + ": " + msg + "\n");
}