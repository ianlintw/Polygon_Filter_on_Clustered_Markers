import React from 'react';
import compose from 'recompose/compose';
import defaultProps from 'recompose/defaultProps';
import withState from 'recompose/withState';
import withHandlers from 'recompose/withHandlers';
import withPropsOnChange from 'recompose/withPropsOnChange';
import GoogleMapReact from 'google-map-react';
import ClusterMarker from './markers/ClusterMarker';
import SimpleMarker from './markers/SimpleMarker';
import supercluster from 'points-cluster';
import { susolvkaCoords, markersData } from './data/fakeData';
import Svg from './polygon/Svg.js';

const defaultOptions = {
        strokeWidth: 1,
        stroke: '#FF5106',
        strokeOpacity: '0.8',
        fill: '#FF4234',
        fillOpacity: '0.3',
        onMouseEnter: function(e) {
        },
        onMouseLeave: function(e) {
        }
      };

export const gMap = ({
  style, hoverDistance, options,
  mapProps: { center, zoom, bounds },
  onChange, onGoogleApiLoaded, onChildMouseEnter, onChildMouseLeave,
  clusters, polygon,
}) => {
  return (
    <GoogleMapReact
      bootstrapURLKeys={{key: 'AIzaSyAa4-L3Yzluy5uJVUTqlrA5OKG6N8_EUtQ', libraries: 'geometry'}}
      style={style}
      options={options}
      hoverDistance={hoverDistance}
      center={center}
      zoom={zoom}
      onChange={onChange}
      onGoogleApiLoaded={onGoogleApiLoaded}
      onChildMouseEnter={onChildMouseEnter}
      onChildMouseLeave={onChildMouseLeave}
    >
      {
        (bounds?
          <Svg
            lat={bounds.nw.lat}
            lng={bounds.nw.lng}
            coordinates={polygon}
            bounds={[bounds.nw.lat, bounds.nw.lng, bounds.se.lat, bounds.nw.lng, bounds.nw.lat, bounds.se.lng, bounds.se.lat, bounds.se.lng]}
            zoom={zoom}
            height={1440}
            width={2560} />
          : //Need to find an appropriate default value and default width/height
          <Svg
            lat={61.42121640831036}
            lng={45.076980519531276}
            coordinates={polygon}
            bounds={[61.42121640831036, 45.076980519531276, 60.19566153425586, 45.076980519531276, 61.42121640831036, 49.026565480468776, 60.19566153425586, 49.026565480468776]}
            zoom={zoom}
            height={1440}
            width={2560} />)
      }
      {
        clusters
          .map(({ ...markerProps, id, numPoints }) => (
            numPoints === 1
              ? <SimpleMarker key={id} {...markerProps} />
              : <ClusterMarker key={id} {...markerProps} />
          ))
      }
    </GoogleMapReact>
);};

export const gMapHOC = compose(
  defaultProps({
    clusterRadius: 60,
    hoverDistance: 30,
    options: {
      minZoom: 3,
      maxZoom: 15,
      scrollwheel: false,
    },
    style: {
      position: 'relative',
      margin: 0,
      padding: 0,
      flex: 1,
    },
    polygon: {
        //A useful online tool to create a polygon on Google Maps for testing: https://codepen.io/jhawes/pen/ujdgK
        coords: [
            {lat: 60.75581, lng: 46.43843}, 
            {lat: 60.63145, lng: 47.04388}, 
            {lat: 60.70343, lng: 47.68779}, 
            {lat: 60.99018, lng: 47.49604}, 
            {lat: 61.07041, lng: 47.03513}, 
            {lat: 60.98951, lng: 46.64889},
            {lat: 60.75581, lng: 46.43843}
        ],
        options: {
          strokeWidth: 1,
          stroke: '#FF5106',
          strokeOpacity: '0.8',
          fill: '#FF4234',
          fillOpacity: '0.3',
          onMouseEnter: function(e) {
          },
          onMouseLeave: function(e) {
          }
        }
    }
  }),
  // withState so you could change markers if you want
  withState(
    'markers',
    'setMarkers',
    markersData
  ),
  withState(
    'hoveredMarkerId',
    'setHoveredMarkerId',
    -1
  ),
  withState(
    'mapProps',
    'setMapProps',
    {
      center: susolvkaCoords,
      zoom: 9,
    }
  ),
  withState(
      'googleApiLoaded',
      'setGoogleApiLoaded',
      false
  ),
  // describe events
  withHandlers({
    onChange: ({ setMapProps }) => ({ center, zoom, bounds }) => {
      setMapProps({ center, zoom, bounds });
    },

    //Looks like I can pass whatever functions or properties defined in defaultProps() or withState()
    onGoogleApiLoaded: ({setGoogleApiLoaded, setMarkers, polygon, markers}) => ({map, maps}) => {
      setGoogleApiLoaded(true);
      console.log('markers:');
      console.log(markers);

      let nativePolygon = new maps.Polygon({ paths: polygon.coords });
      let latLngs = markers.map((latlng) => (new maps.LatLng(latlng.lat, latlng.lng)));
      let in_out_s = latLngs.map((latlng) => (maps.geometry.poly.containsLocation(latlng, nativePolygon) ? true: false));
      console.log('in_out_s:');
      console.log(in_out_s);
      let markers_filtered = [];
      in_out_s.forEach((in_out, i) => {
        if(in_out){
          markers_filtered.push(markers[i]);
        }
      });
      console.log('markers_filtered:');
      console.log(markers_filtered);
      setTimeout(() => {
        setMarkers(markers_filtered);
      }, 1500);
    },

    onChildMouseEnter: ({ setHoveredMarkerId }) => (hoverKey, { id }) => {
      setHoveredMarkerId(id);
    },

    onChildMouseLeave: ({ setHoveredMarkerId }) => (/* hoverKey, childProps */) => {
      setHoveredMarkerId(-1);
    },
  }),
  // precalculate clusters if markers data has changed
  withPropsOnChange(
    ['markers'],
    ({ markers = [], clusterRadius, options: { minZoom, maxZoom } }) => {
        console.log('OnChange 1');
        return ({
          getCluster: supercluster(
            markers,
            {
              minZoom, // min zoom to generate clusters on
              maxZoom, // max zoom level to cluster the points on
              radius: clusterRadius, // cluster radius in pixels
            }
          ),
        });}
  ),
  // get clusters specific for current bounds and zoom
  withPropsOnChange(
    ['mapProps', 'getCluster'],
    ({ mapProps, getCluster }) => {
        console.log('OnChange 2');
        return ({
          clusters: mapProps.bounds
            ? getCluster(mapProps)
              .map(({ wx, wy, numPoints, points }) => ({
                lat: wy,
                lng: wx,
                text: numPoints,
                numPoints,
                id: `${numPoints}_${points[0].id}`,
              }))
            : [],
        });}
  ),
  // set hovered
  withPropsOnChange(
    ['clusters', 'hoveredMarkerId'],
    ({ clusters, hoveredMarkerId }) => {
        return ({
          clusters: clusters
            .map(({ ...cluster, id }) => ({
              ...cluster,
              hovered: id === hoveredMarkerId,
            })),
        });}
  ),
);

export default gMapHOC(gMap);
