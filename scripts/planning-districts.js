/* global districtsGeojson, indicators, labels */
(function () {
  var container = document.querySelector('#map')
  var DEFAULT_CENTER = [39.9628, -75.1185]
  var DEFAULT_ZOOM = 11
  var TILES_BASEMAP = 'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap/MapServer'
  var TILES_LABELS = 'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap_Labels/MapServer'

  // Create map
  var mapOpts = { zoomControl: false }
  var map = L.map(container, mapOpts)
    .setView(DEFAULT_CENTER, DEFAULT_ZOOM)
    .addLayer(L.esri.tiledMapLayer({ url: TILES_BASEMAP }))
  var layerGroup = L.layerGroup().addTo(map)

  // Key indicators by slug
  // Note this relies on jekyll/liquid and the slugify function below
  // producing matching strings.
  var keyedIndicators = {}
  indicators.forEach(function (indicator) {
    var slug = slugify(indicator.Indicator)
    keyedIndicators[slug] = indicator
  })

  // Bind onhashchange event to update function and execute it once
  // immediately, in case there's a hash set on page load
  window.onhashchange = updateMapByHash
  updateMapByHash()

  // Get indicator from hash, remove current choropleth layer, add new one
  function updateMapByHash () {
    var hash = window.location.hash.substr(1)
    var indicator = hash && keyedIndicators[hash]
    if (indicator) {
      layerGroup.clearLayers()
      createChoroplethLayer(districtsGeojson, indicator).addTo(layerGroup)
      updateMapTitle(indicator.Indicator)
      setSelectedCard(hash)
    }
  }

  function getDistrictValue (indicator, district) {
    try {
      return +indicator[district]
    } catch (err) {
      console.error(err)
    }
  }

  function formatValue (indicator, value) {
    if (indicator.dataType === 'Percentage') {
      return (Math.round(value * 100 * 100) / 100) + '%'
    } else if (indicator.dataType === 'Count') {
      return Math.round(value).toLocaleString()
    } else {
      return value
    }
  }

  function createChoroplethLayer (geojson, indicator) {
    return L.choropleth(geojson, {
      scale: ['#96c9ff', '#0f4d90'],
      steps: 5,
      mode: 'q',
      style: {
        color: '#fff',
        weight: 0.8,
        opacity: 0.85,
        fillOpacity: 0.75
      },
      valueProperty: function (feature) {
        var district = feature.properties.DIST_NAME
        return getDistrictValue(indicator, district)
      },
      onEachFeature: function (feature, layer) {
        var district = feature.properties.DIST_NAME
        var value = getDistrictValue(indicator, district)
        var formattedValue = formatValue(indicator, value)
        var tooltipContents = district + '<br>' + formattedValue
        layer.bindTooltip(tooltipContents)
      }
    })
  }

  function updateMapTitle (title) {
    document.querySelector('#map-title').innerText = title
  }

  function setSelectedCard (slug) {
    var cardsNodeList = document.querySelectorAll('.indicator-card')
    var cards = [].slice.call(cardsNodeList) // convert to Array
    cards.forEach(function (card) {
      if (card.id === 'card-' + slug) {
        card.classList.add('is-selected')
      } else {
        card.classList.remove('is-selected')
      }
    })
  }

  function slugify (text) {
    return text.toString().toLowerCase().trim()
      .replace(/[^a-zA-Z0-9]/g, '-')  // Replace non-alphanumeric chars with -
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^\-|\-$/i, '')        // Remove leading/trailing hyphen
  }
})()
