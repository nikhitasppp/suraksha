import { MapContainer, TileLayer, CircleMarker, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

// Leaflet marker-icon fix for Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SEVERE = new Set(['violent-crime', 'robbery', 'sexual-offences', 'possession-of-weapons']);
function dotColor(cat) {
  if (SEVERE.has(cat)) return '#ff5a6e';
  if (cat === 'anti-social-behaviour' || cat === 'public-order') return '#fbbf24';
  if (cat === 'drugs') return '#a78bfa';
  return '#60a5fa';
}

function formatCategory(cat) {
  return cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function Recenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom || Math.max(map.getZoom(), 13), { animate: true });
  }, [center]);
  return null;
}

function ClickHandler({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

export default function MapView({ center, zoom, selected, incidents = [], reports = [], onPick }) {
  return (
    <MapContainer center={center} zoom={zoom || 12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
      />
      <ClickHandler onPick={onPick} />
      <Recenter center={selected || center} zoom={zoom} />

      {incidents.map((inc, i) => (
        <CircleMarker
          key={`i-${i}`}
          center={[inc.lat, inc.lng]}
          radius={7}
          pathOptions={{
            color: dotColor(inc.category),
            fillColor: dotColor(inc.category),
            fillOpacity: 0.4,
            weight: 0,
          }}
        >
          <Tooltip direction="top" offset={[0, -4]} opacity={0.9}>
            {formatCategory(inc.category)}
          </Tooltip>
        </CircleMarker>
      ))}

      {reports.map((r) => {
        const verified = r.verified !== false;
        return (
          <CircleMarker
            key={`r-${r.id}`}
            center={[r.lat, r.lng]}
            radius={9}
            pathOptions={{
              color: '#ff9933',
              fillColor: '#ff9933',
              fillOpacity: verified ? 0.7 : 0.25,
              weight: 2,
              opacity: verified ? 1 : 0.5,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={0.9}>
              <strong style={{ textTransform: 'capitalize' }}>
                {r.type.replace(/-/g, ' ')}
              </strong>
              {r.note && <><br />{r.note}</>}
              <br />{new Date(r.createdAt).toLocaleDateString()}
              {!verified && <><br /><em style={{ color: '#fbbf24' }}>unverified</em></>}
            </Tooltip>
          </CircleMarker>
        );
      })}

      {selected && <Marker position={selected} />}
    </MapContainer>
  );
}
