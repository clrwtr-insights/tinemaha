// add loader gif
$(window).ready(function() {
    $('.loader').fadeOut("slow");
  });

// bounds for closed sidebar
  var lakeBoundsClosed = L.latLngBounds(
    L.latLng(37.03682847322645, -118.24524538873912), //Southwest
    L.latLng(37.086544893917534, -118.20276183899338), //Northeast
  );

// bounds for open sidebar
  var lakeBoundsClosedMini = L.latLngBounds(
    L.latLng(37.03682847322645, -118.27524538873912), //Southwest
    L.latLng(37.086544893917534, -118.20276183899338), //Northeast
  );

// leaflet map options
  var mymap = L.map('map', {
    // center: [44.70580544041939, -122.24899460193791],
    zoomControl: false,
    zoom: 14,
    maxZoom: 15,
    minZoom: 11,
    // maxBounds: lakeBounds,
    // maxBoundsViscosity: .8,
  });

// fit to initial bounds
mymap.fitBounds(lakeBoundsClosedMini);

// collect and add basemaps
var voyager =
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png');
var satellite =
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');
var USGS_USImagery = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 20,
  attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
}).addTo(mymap);

var baseLayers = {
  'CartoDB Voyager': voyager,
  'ESRI Satellite': satellite,
  'USGS_USImagery': USGS_USImagery,
}

L.Control.MousePosition = L.Control.extend({
  options: {
    position: 'bottomleft',
    separator: ' : ',
    emptyString: 'Unavailable',
    lngFirst: false,
    numDigits: 5,
    lngFormatter: undefined,
    latFormatter: undefined,
    prefix: ""
  },

  onAdd: function(map) {
    this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
    L.DomEvent.disableClickPropagation(this._container);
    mymap.on('mousemove', this._onMouseMove, this);
    this._container.innerHTML = this.options.emptyString;
    return this._container;
  },

  onRemove: function(map) {
    map.off('mousemove', this._onMouseMove)
  },

  _onMouseMove: function(e) {
    var lng = this.options.lngFormatter ? this.options.lngFormatter(e.latlng.lng) : L.Util.formatNum(e.latlng.lng, this.options.numDigits);
    var lat = this.options.latFormatter ? this.options.latFormatter(e.latlng.lat) : L.Util.formatNum(e.latlng.lat, this.options.numDigits);
    var value = this.options.lngFirst ? lng + this.options.separator + lat : lat + this.options.separator + lng;
    var prefixAndValue = this.options.prefix + ' ' + value;
    this._container.innerHTML = prefixAndValue;
  }

});

L.Map.mergeOptions({
  positionControl: false
});

L.Map.addInitHook(function() {
  if (this.options.positionControl) {
    this.positionControl = new L.Control.MousePosition();
    this.addControl(this.positionControl);
  }
});

// add leaflet plugins
L.control.mousePosition = function(options) {
  return new L.Control.MousePosition(options);
};
L.control.mousePosition({
  position: 'topright'
}).addTo(mymap);
L.control.scale({
  position: 'topright'
}).addTo(mymap);
new L.control.layers(baseLayers, {}, {
  collapsed: true
}).addTo(mymap);
new L.Control.zoomHome({
  position: 'topright'
}).addTo(mymap);

// create charts objects
var chart, sampleChart, precipChart, airTempChart, toxinChart, nitrateChart;

// create color pallets
var colors = chroma.scale('Spectral').domain([0, 1]).padding(0.15).mode('lch').colors(6);
var color = chroma.scale('Spectral').domain([0, 1]).padding(0.15).mode('lch').colors(6);

// create map legend
for (i = 0; i < 6; i++) {
  $('head').append($("<style> .legend-color-" + (i + 1).toString() + " { background: " + color[i] + "; font-size: 15px; opacity: .6; text-shadow: 0 0 0px #ffffff;} </style>"));
}

// hexbin options
var options = {
  radius: 12,
  opacity: .6,
  colorRange: [colors[5], colors[4], colors[3], colors[2], colors[1], colors[0]],
  colorScaleExtent: [1, 1.2],
  duration: 500,
  radiusRange: [11, 11],
};

// hexbin map layer
var hexLayer = L.hexbinLayer(options).addTo(mymap)

// hexlayer options
function tooltip_function(d) {

  var chlA_sum = d.reduce(function(acc, obj) {
    return (acc + parseFloat(obj["o"][2]));
  }, 0);

  avgChl = chlA_sum / d.length;
  avgChl = d3.format(".3")(avgChl);
  var tooltip_text = `Avg. Chlorophyll: ${String(avgChl)}`

  return tooltip_text
}
$('#myOpacityRange').on('input', function(value) {
  $('.hexbin').css({
    opacity: $(this).val() * '.1'
  });
});

hexLayer
  .lng(function(d) {
    return d[0];
  })
  .lat(function(d) {
    return d[1];
  })
  .colorValue(
    function(d) {
      var sum = d.reduce(function(acc, obj) {
        return (acc + parseFloat(obj["o"][2]));
      }, 0);
      avgChl = sum / d.length;
      return avgChl
    }
  )
  .hoverHandler(L.HexbinHoverHandler.compound({
    handlers: [
      L.HexbinHoverHandler.resizeFill(),
      L.HexbinHoverHandler.tooltip({
        tooltipContent: tooltip_function
      })
    ]
  }));

  dateSelect = $('#d0').val();
  let [y, m, d] = dateSelect.split('-');
  mapYear = y;
  mapMonth = m;
  mapDay = d;
  mapDateString = mapYear + '_' + mapMonth + '_' + mapDay;
  // Parse date in YYYY-MM-DD format as local date
  function parseISOLocal(s) {
    let [y, m, d] = s.split('-');
    return new Date(y, m - 1, d);
  }

  // Format date as YYYY-MM-DD
  function dateToISOLocal(date) {
    let z = n => ('0' + n).slice(-2);
    return date.getFullYear() + '-' + z(date.getMonth() + 1) + '-' + z(date.getDate());
  }

  // Convert range slider value to date string
  function range2date(evt) {
    let dateInput = document.querySelector('#d0');
    let minDate = parseISOLocal(dateInput.min);
    minDate.setDate(minDate.getDate() + Number(this.value));
    dateInput.value = dateToISOLocal(minDate);
    dateSelect = $('#d0').val();
    let [y, m, d] = dateSelect.split('-');
    mapYear = y;
    mapMonth = m;
    mapDay = d;
    mapDateString = mapYear + '_' + mapMonth + '_' + mapDay;
    titleDateString = mapMonth + '/' + mapDay + '/' + mapYear;
    Promise.all([
      d3.csv('assets/satellite_map/tinemaha_chlorophyll_' + mapDateString + '.csv'), //datasets[0]
    ]).then(function(datasets) {
      hexdata = [];
      datasets[0].forEach(function(d) {
        hexdata.push([
          d.lon,
          d.lat,
          d.Chlorophyll,
        ]);
      })
      hexLayer.data(hexdata);
    });
    $("#sat-title").text(titleDateString);
  }


  // Convert entered date to range
  function date2range(evt) {
    let date = parseISOLocal(this.value);
    let numDays = (date - new Date(this.min)) / 8.64e7;
    document.querySelector('#myRange').value = numDays;
    dateSelect = $('#d0').val();
    let [y, m, d] = dateSelect.split('-');
    mapYear = y;
    mapMonth = m;
    mapDay = d;
    mapDateString = mapYear + '_' + mapMonth + '_' + mapDay;

    Promise.all([
      d3.csv('assets/satellite_map/tinemaha_chlorophyll_' + mapDateString + '.csv'), //datasets[0]
    ]).then(function(datasets) {
      hexdata = [];
      datasets[0].forEach(function(d) {
        hexdata.push([
          d.lon,
          d.lat,
          d.Chlorophyll,
        ]);
      })
      hexLayer.data(hexdata);
    });


  }

  window.onload = function() {
    let rangeInput = document.querySelector('#myRange');
    let dateInput = document.querySelector('#d0');
    // Get the number of days from the date min and max
    // Dates in YYYY-MM-DD format are treated as UTC
    // so will be exact whole days

    let rangeMax = (new Date(dateInput.max) - new Date(dateInput.min)) / 8.64e7;
    // Set the range min and max values
    rangeInput.min = 0;
    rangeInput.max = rangeMax;
    // Add listener to set the date input value based on the slider
    rangeInput.addEventListener('input', range2date, false);
    // Add listener to set the range input value based on the date
    dateInput.addEventListener('change', date2range, false);

  }

  var gageID = "14178000";

  Promise.all([
    d3.csv('assets/satellite_map/tinemaha_chlorophyll_' + mapDateString + '.csv'), //datasets[0]
    d3.csv('assets/weather_tab/tinemaha_prism_2012_01_01_2021_10_23.csv'), //datasets[1]
    d3.json("assets/weather_tab/weather.geojson"), //datasets[2]
  ]).then(function(datasets) {

    // hex data
    hexdata = [];
    datasets[0].forEach(function(d) {
      hexdata.push([
        d.lon,
        d.lat,
        d.Chlorophyll,
        d.date,
      ]);
    })
    hexLayer.data(hexdata);

// weather tab JS
    var wt = ["Date"];
    weatherData2021 = [];
    weatherData2021pcMean = ["2021"];
    weatherData2021pcSum = ["2021"];
    weatherData2021atempMean = ["2021"];
    weatherData2021atempSum = ["2021"];
    weatherData2020 = [];
    weatherData2020pcMean = ["2020"];
    weatherData2020pcSum = ["2020"];
    weatherData2020atempMean = ["2020"];
    weatherData2020atempSum = ["2020"];
    weatherData2019 = [];
    weatherData2019pcMean = ["2019"];
    weatherData2019pcSum = ["2019"];
    weatherData2019atempMean = ["2019"];
    weatherData2019atempSum = ["2019"];
    weatherData2018 = [];
    weatherData2018pcMean = ["2018"];
    weatherData2018pcSum = ["2018"];
    weatherData2018atempMean = ["2018"];
    weatherData2018atempSum = ["2018"];
    weatherData2017 = [];
    weatherData2017pcMean = ["2017"];
    weatherData2017pcSum = ["2017"];
    weatherData2017atempMean = ["2017"];
    weatherData2017atempSum = ["2017"];
    weatherData2016 = [];
    weatherData2016pcMean = ["2016"];
    weatherData2016pcSum = ["2016"];
    weatherData2016atempMean = ["2016"];
    weatherData2016atempSum = ["2016"];
    weatherData2015 = [];
    weatherData2015pcMean = ["2015"];
    weatherData2015pcSum = ["2015"];
    weatherData2015atempMean = ["2015"];
    weatherData2015atempSum = ["2015"];
    weatherData2014 = [];
    weatherData2014pcMean = ["2014"];
    weatherData2014pcSum = ["2014"];
    weatherData2014atempMean = ["2014"];
    weatherData2014atempSum = ["2014"];
    weatherData2013 = [];
    weatherData2013pcMean = ["2013"];
    weatherData2013pcSum = ["2013"];
    weatherData2013atempMean = ["2013"];
    weatherData2013atempSum = ["2013"];
    weatherData2012 = [];
    weatherData2012pcMean = ["2012"];
    weatherData2012pcSum = ["2012"];
    weatherData2012atempMean = ["2012"];
    weatherData2012atempSum = ["2012"];

    var weatherVars = {
      name: "Precip",
      pcM2021: weatherData2021pcMean,
      pcS2021: weatherData2021pcSum,
      atempM2021: weatherData2021atempMean,
      atempS2021: weatherData2021atempSum,
      pcM2020: weatherData2020pcMean,
      pcS2020: weatherData2020pcSum,
      atempM2020: weatherData2020atempMean,
      atempS2020: weatherData2020atempSum,
      pcM2019: weatherData2019pcMean,
      pcS2019: weatherData2019pcSum,
      atempM2019: weatherData2019atempMean,
      atempS2019: weatherData2019atempSum,
      pcM2018: weatherData2018pcMean,
      pcS2018: weatherData2018pcSum,
      atempM2018: weatherData2018atempMean,
      atempS2018: weatherData2018atempSum,
      pcM2017: weatherData2017pcMean,
      pcS2017: weatherData2017pcSum,
      atempM2017: weatherData2017atempMean,
      atempS2017: weatherData2017atempSum,
      pcM2016: weatherData2016pcMean,
      pcS2016: weatherData2016pcSum,
      atempM2016: weatherData2016atempMean,
      atempS2016: weatherData2016atempSum,
      pcM2015: weatherData2015pcMean,
      pcS2015: weatherData2015pcSum,
      atempM2015: weatherData2015atempMean,
      atempS2015: weatherData2015atempSum,
      pcM2014: weatherData2014pcMean,
      pcS2014: weatherData2014pcSum,
      atempM2014: weatherData2014atempMean,
      atempS2014: weatherData2014atempSum,
      pcM2013: weatherData2013pcMean,
      pcS2013: weatherData2013pcSum,
      atempM2013: weatherData2013atempMean,
      atempS2013: weatherData2013atempSum,
      pcM2012: weatherData2012pcMean,
      pcS2012: weatherData2012pcSum,
      atempM2012: weatherData2012atempMean,
      atempS2012: weatherData2012atempSum,
    }
    function varsCounts(i) {

      let weatherData = datasets[1];
      for (let i = 0; i < weatherData.length; i++) {
        witems = weatherData[i].date.split('-');
        weatherYear = witems[0];
        weatherMonth = witems[1];
        weatherDay = witems[2];
        switch (weatherYear) {
          case "2021":
            weatherData2021pcMean.push(weatherData[i].Precip_mean);
            weatherData2021pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2021atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2021atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2020":
            wt.push(weatherData[i].date);
            weatherData2020pcMean.push(weatherData[i].Precip_mean);
            weatherData2020pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2020atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2020atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2019":
            weatherData2019pcMean.push(weatherData[i].Precip_mean);
            weatherData2019pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2019atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2019atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2018":
            weatherData2018pcMean.push(weatherData[i].Precip_mean);
            weatherData2018pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2018atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2018atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2017":
            weatherData2017pcMean.push(weatherData[i].Precip_mean);
            weatherData2017pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2017atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2017atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2016":
            weatherData2016pcMean.push(weatherData[i].Precip_mean);
            weatherData2016pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2016atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2016atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2015":
            weatherData2015pcMean.push(weatherData[i].Precip_mean);
            weatherData2015pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2015atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2015atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2014":
            weatherData2014pcMean.push(weatherData[i].Precip_mean);
            weatherData2014pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2014atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2014atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2013":
            weatherData2013pcMean.push(weatherData[i].Precip_mean);
            weatherData2013pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2013atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2013atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2012":
            weatherData2012pcMean.push(weatherData[i].Precip_mean);
            weatherData2012pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2012atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2012atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2011":
            weatherData2011pcMean.push(weatherData[i].Precip_mean);
            weatherData2011pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2011atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2011atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2010":
            weatherData2010pcMean.push(weatherData[i].Precip_mean);
            weatherData2010pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2010atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2010atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          default:
        }


      }
    }



    varsCounts(weatherVars);


    var padTop = 10;
    var padRight = 30;
    // weather chart
    precipSubChart = c3.generate({
      size: {
        height: 250,

      },
      data: {
        x: "Date",
        columns: [wt, weatherVars.pcM2021, weatherVars.pcM2020],
        type: 'spline',
      },
      // color: {
      //   pattern: [chartColor]
      // },
      subchart: {
        show: true,
        axis: {
          x: {
            show: false
          }
        },
        size: {
          height: 15
        },
        onbrush: function(d) {
          precipChart.zoom(precipSubChart.zoom());
          aitTempChart.zoom(precipSubChart.zoom());
          precipSumChart.zoom(precipSubChart.zoom());
          aitTempSumChart.zoom(precipSubChart.zoom());
        },
      },

      padding: {
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'Avg. precipitation (mL)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          tick: {
            format: d3.format(".2s"),

            count: 5,
            // values: [0,5000,10000,15000]
          }
        }
      },
      point: {
        r: 0,
        focus: {
          expand: {
            r: 10
          }
        }
      },
      zoom: {
        // rescale: true,+
        enabled: true,
        type: "scroll",
        onzoom: function(d) {
          precipChart.zoom(precipSubChart.zoom());
          aitTempChart.zoom(precipSubChart.zoom());
          precipSumChart.zoom(precipSubChart.zoom());
          aitTempSumChart.zoom(precipSubChart.zoom());
        }
      },
      tooltip: {
        linked: true,
      },
      legend: {
        enabled: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#precipSub-chart"
    });
    $("#precipSub-chart > svg > g:nth-child(2)").hide();
    var stroke2021 = precipSubChart.color('2021');
    $("#weather2021").css('color', stroke2021);
    var stroke2020 = precipSubChart.color('2020');
    $("#weather2020").css('color', stroke2020);

    // weather chart
    precipChart = c3.generate({
      size: {
        height: 220,

      },
      data: {
        x: "Date",
        columns: [wt, weatherVars.pcM2021, weatherVars.pcM2020],
        type: 'spline',
      },

      padding: {
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'Avg. precipitation (mL)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          tick: {
            format: d3.format(".2s"),

            count: 5,
            // values: [0,5000,10000,15000]
          }
        }
      },
      point: {
        r: 0,
        focus: {
          expand: {
            r: 10
          }
        }
      },
      // zoom: {
      //   // rescale: true,+
      //   enabled: true,
      //   type: "scroll",
      //   onzoom: function(d) {
      //     aitTempChart.zoom(precipChart.zoom());
      //     // step();
      //   }
      // },
      tooltip: {
        linked: true,
      },
      legend: {
        show: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#precip-chart"
    });
    // Air Temp Chart
    aitTempChart = c3.generate({
      size: {
        height: 220,
      },
      data: {
        x: "Date",
        columns: [wt, weatherVars.atempM2021, weatherVars.atempM2020],
        type: 'spline',
      },
      // color: {
      //   pattern: [chartColor]
      // },
      padding: {
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d ",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'Avg. air temp (deg C)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          tick: {
            format: d3.format(".2s"),

            count: 5,
            // values: [0,5000,10000,15000]
          }
        }
      },
      point: {
        r: 0,
        focus: {
          expand: {
            r: 10
          }
        }
      },
      // zoom: {
      //   enabled: {
      //     type: "drag"
      //   },
      // },
      tooltip: {
        linked: true,
      },
      legend: {
        show: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#airTemp-chart"
    });
    precipSumChart = c3.generate({
      size: {
        height: 220,
      },
      data: {
        x: "Date",
        columns: [wt, weatherVars.pcS2021, weatherVars.pcS2020],
        type: 'spline',
      },
      // color: {
      //   pattern: [chartColor]
      // },
      padding: {
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d ",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'cumulative sum of mean precip. (deg C)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          tick: {
            format: d3.format(".2s"),

            count: 5,
            // values: [0,5000,10000,15000]
          }
        }
      },
      point: {
        r: 0,
        focus: {
          expand: {
            r: 10
          }
        }
      },
      // zoom: {
      //   enabled: {
      //     type: "drag"
      //   },
      // },
      tooltip: {
        linked: true,
      },
      legend: {
        show: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#precipSum-chart"
    });
    aitTempSumChart = c3.generate({
      size: {
        height: 220,
      },
      data: {
        x: "Date",
        columns: [wt, weatherVars.atempS2021, weatherVars.atempS2020],
        type: 'spline',
      },
      // color: {
      //   pattern: [chartColor]
      // },
      padding: {
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d ",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'cumulative sum of mean air temp. (mL)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          tick: {
            format: d3.format(".2s"),

            count: 5,
            // values: [0,5000,10000,15000]
          }
        }
      },
      point: {
        r: 0,
        focus: {
          expand: {
            r: 10
          }
        }
      },
      // zoom: {
      //   enabled: {
      //     type: "drag"
      //   },
      // },
      tooltip: {
        linked: true,
      },
      legend: {
        show: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#airTempSum-chart"
    });

    function weatherStyle(feature) {

      return {
        fillColor: setColor(feature.properties.Cases),
        fillOpacity: 0.4,
        weight: 1,
        opacity: 1,
        color: '#b4b4b4',
        dashArray: '3'
      };

    }

    // 3.3 add these event the layer obejct.
    function weatherOnEachFeature(feature, layer) {
      layer.on({
          // mouseover: highlightFeature,
          // click: sampleZoomToFeature,
          // mouseout: resetHighlight
        }),
        layer.bindTooltip(feature.properties.site, {
          className: 'feature-label',
          permanent: false,
          sticky: true,
          direction: 'auto'
        });
    }

    var weatherSites = new L.GeoJSON(datasets[2], {
      style: weatherStyle,
      onEachFeature: weatherOnEachFeature,
      // onEachFeature: function(feature, layer) {
      //   layer.bindPopup('<b>Site Name: </b>' + feature.properties.usgs_site)
      // },

      pointToLayer: function(feature, latlng) {
        return L.marker(latlng, {
          icon: L.divIcon({
            className: 'map fas fa-cloud-sun-rain blinking',
          })
        });
      },
    }).addTo(mymap);



    // Weather Year Selection
    $("#weather2021").on("click", function() {
      color2021 = $("#weather2021").css('color');
      if (color2021 == 'rgb(255, 255, 255)') {

        precipSubChart.load({
          columns: [weatherVars.pcM2021],
        });
        precipChart.load({
          columns: [weatherVars.pcM2021],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2021],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2021],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2021],
        });
        var stroke = precipSubChart.color('2021');
        $("#weather2021").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2021"],
        });
        precipChart.unload({
          ids: ["2021"],
        });
        aitTempChart.unload({
          ids: ["2021"],
        });
        precipSumChart.unload({
          ids: ["2021"],
        });
        aitTempSumChart.unload({
          ids: ["2021"],
        });
        $("#weather2021").css('color', 'white');

      }

    });
    $("#weather2020").on("click", function() {
      color2020 = $("#weather2020").css('color');
      if (color2020 == 'rgb(255, 255, 255)') {


        precipSubChart.load({
          columns: [weatherVars.pcM2020],
        });
        precipChart.load({
          columns: [weatherVars.pcM2020],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2020],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2020],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2020],
        });
        var stroke = precipSubChart.color('2020');
        $("#weather2020").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2020"],
        });
        precipChart.unload({
          ids: ["2020"],
        });
        aitTempChart.unload({
          ids: ["2020"],
        });
        precipSumChart.unload({
          ids: ["2020"],
        });
        aitTempSumChart.unload({
          ids: ["2020"],
        });
        $("#weather2020").css('color', 'white');

      }

    });
    $("#weather2019").on("click", function() {
      color2019 = $("#weather2019").css('color');
      if (color2019 == 'rgb(255, 255, 255)') {


        precipSubChart.load({
          columns: [weatherVars.pcM2019],
        });
        precipChart.load({
          columns: [weatherVars.pcM2019],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2019],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2019],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2019],
        });
        var stroke = precipSubChart.color('2019');
        $("#weather2019").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2019"],
        });
        precipChart.unload({
          ids: ["2019"],
        });
        aitTempChart.unload({
          ids: ["2019"],
        });
        precipSumChart.unload({
          ids: ["2019"],
        });
        aitTempSumChart.unload({
          ids: ["2019"],
        });
        $("#weather2019").css('color', 'white');

      }

    });
    $("#weather2018").on("click", function() {
      color2018 = $("#weather2018").css('color');
      if (color2018 == 'rgb(255, 255, 255)') {


        precipSubChart.load({
          columns: [weatherVars.pcM2018],
        });
        precipChart.load({
          columns: [weatherVars.pcM2018],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2018],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2018],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2018],
        });
        var stroke = precipSubChart.color('2018');
        $("#weather2018").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2018"],
        });
        precipChart.unload({
          ids: ["2018"],
        });
        aitTempChart.unload({
          ids: ["2018"],
        });
        precipSumChart.unload({
          ids: ["2018"],
        });
        aitTempSumChart.unload({
          ids: ["2018"],
        });
        $("#weather2018").css('color', 'white');

      }

    });
    $("#weather2017").on("click", function() {
      color2017 = $("#weather2017").css('color');
      if (color2017 == 'rgb(255, 255, 255)') {


        precipSubChart.load({
          columns: [weatherVars.pcM2017],
        });
        precipChart.load({
          columns: [weatherVars.pcM2017],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2017],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2017],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2017],
        });
        var stroke = precipSubChart.color('2017');
        $("#weather2017").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2017"],
        });
        precipChart.unload({
          ids: ["2017"],
        });
        aitTempChart.unload({
          ids: ["2017"],
        });
        precipSumChart.unload({
          ids: ["2017"],
        });
        aitTempSumChart.unload({
          ids: ["2017"],
        });
        $("#weather2017").css('color', 'white');

      }

    });
    $("#weather2016").on("click", function() {
      color2016 = $("#weather2016").css('color');
      if (color2016 == 'rgb(255, 255, 255)') {


        precipSubChart.load({
          columns: [weatherVars.pcM2016],
        });
        precipChart.load({
          columns: [weatherVars.pcM2016],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2016],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2016],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2016],
        });
        var stroke = precipSubChart.color('2016');
        $("#weather2016").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2016"],
        });
        precipChart.unload({
          ids: ["2016"],
        });
        aitTempChart.unload({
          ids: ["2016"],
        });
        precipSumChart.unload({
          ids: ["2016"],
        });
        aitTempSumChart.unload({
          ids: ["2016"],
        });
        $("#weather2016").css('color', 'white');

      }

    });
    $("#weather2015").on("click", function() {
      color2015 = $("#weather2015").css('color');
      if (color2015 == 'rgb(255, 255, 255)') {


        precipSubChart.load({
          columns: [weatherVars.pcM2015],
        });
        precipChart.load({
          columns: [weatherVars.pcM2015],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2015],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2015],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2015],
        });
        var stroke = precipSubChart.color('2015');
        $("#weather2015").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2015"],
        });
        precipChart.unload({
          ids: ["2015"],
        });
        aitTempChart.unload({
          ids: ["2015"],
        });
        precipSumChart.unload({
          ids: ["2015"],
        });
        aitTempSumChart.unload({
          ids: ["2015"],
        });
        $("#weather2015").css('color', 'white');

      }

    });
    $("#weather2014").on("click", function() {
      color2014 = $("#weather2014").css('color');
      if (color2014 == 'rgb(255, 255, 255)') {
        precipSubChart.load({
          columns: [weatherVars.pcM2014],
        });
        precipChart.load({
          columns: [weatherVars.pcM2014],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2014],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2014],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2014],
        });
        var stroke = precipSubChart.color('2014');
        $("#weather2014").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2014"],
        });
        precipChart.unload({
          ids: ["2014"],
        });
        aitTempChart.unload({
          ids: ["2014"],
        });
        precipSumChart.unload({
          ids: ["2014"],
        });
        aitTempSumChart.unload({
          ids: ["2014"],
        });
        $("#weather2014").css('color', 'white');

      }

    });
    $("#weather2013").on("click", function() {
      color2013 = $("#weather2013").css('color');
      if (color2013 == 'rgb(255, 255, 255)') {
        precipSubChart.load({
          columns: [weatherVars.pcM2013],
        });
        precipChart.load({
          columns: [weatherVars.pcM2013],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2013],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2013],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2013],
        });
        var stroke = precipSubChart.color('2013');
        $("#weather2013").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2013"],
        });
        precipChart.unload({
          ids: ["2013"],
        });
        aitTempChart.unload({
          ids: ["2013"],
        });
        precipSumChart.unload({
          ids: ["2013"],
        });
        aitTempSumChart.unload({
          ids: ["2013"],
        });
        $("#weather2013").css('color', 'white');

      }

    });
    $("#weather2012").on("click", function() {
      color2012 = $("#weather2012").css('color');
      if (color2012 == 'rgb(255, 255, 255)') {
        precipSubChart.load({
          columns: [weatherVars.pcM2012],
        });
        precipChart.load({
          columns: [weatherVars.pcM2012],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2012],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2012],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2012],
        });
        var stroke = precipSubChart.color('2012');
        $("#weather2012").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2012"],
        });
        precipChart.unload({
          ids: ["2012"],
        });
        aitTempChart.unload({
          ids: ["2012"],
        });
        precipSumChart.unload({
          ids: ["2012"],
        });
        aitTempSumChart.unload({
          ids: ["2012"],
        });
        $("#weather2012").css('color', 'white');

      }

    });


  });

  // Tab JS
  var triggerTabList = [].slice.call(document.querySelectorAll('#weather-tab'))
  triggerTabList.forEach(function(triggerEl) {
    var tabTrigger = new bootstrap.Tab(triggerEl)
    triggerEl.addEventListener('click', function(event) {
      event.preventDefault()
      tabTrigger.show()

    })
  })
  var triggerTabList = [].slice.call(document.querySelectorAll('#stream-tab'))
  triggerTabList.forEach(function(triggerEl) {
    var tabTrigger = new bootstrap.Tab(triggerEl)
    triggerEl.addEventListener('click', function(event) {
      event.preventDefault()
      tabTrigger.show()

    })
  })
  var triggerTabList = [].slice.call(document.querySelectorAll('#sample-tab'))
  triggerTabList.forEach(function(triggerEl) {
    var tabTrigger = new bootstrap.Tab(triggerEl)
    triggerEl.addEventListener('click', function(event) {
      event.preventDefault()
      tabTrigger.show()

    })
  })
  var today = new Date();

  var date = (today.getMonth() + 1) + '-' + today.getDate() + '-' + today.getFullYear();

  $("#date").text("Last update: " + date);

  function openNav() {
    // $("#info").css("left","0%");
    $("#info").show();
    $("#openBar").hide();
    // center = L.latLng(44.70744, -126.18925);
    mymap.fitBounds(lakeBoundsClosedMini);
    // document.getElementById("main").style.marginLeft = "250px";
  }

  function closeNav() {
    // $("#info").css("left","-50%");
    $("#info").hide();
    $("#openBar").show();
    mymap.fitBounds(lakeBoundsClosed);
  }
  $("#sat-tab").on("click", function() {
    $("#infoMapLegend").hide();
    $("#sat-button").show();
  });
  $("#sat-button").on("click", function() {
    $("#infoMapLegend").show();
    $("#sat-button").hide();
  });
  $("#sat-button").hide();
  // function closeNav() {
  //   $("#infoContainer").hide();
  // }
  $("#openBar").hide();
  $(".leaflet-control-attribution")
    .css("background-color", "transparent")
    .css("color", "white")
    .html("Supported by <a href='https://www.clrwater.io/' target='_blank' style='color:white;''> ClearWater Analytica </a>");
