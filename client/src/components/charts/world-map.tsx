import React from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface WorldMapProps {
  data: Array<{
    country: string; // Tên quốc gia khớp geo.properties.name
    count: number;
  }>;
}

export default function WorldMap({ data }: WorldMapProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Không có dữ liệu bản đồ</div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getFillColor = (count: number) => {
    if (count <= 0) return "#e5e7eb"; // xám nhạt
    if (count < 5) return "#16a34a"; // xanh (1-4)
    if (count < 10) return "#2563eb"; // xanh dương (5-9)
    if (count < 15) return "#eab308"; // vàng (10-14)
    if (count < 20) return "#f97316"; // cam (15-19)
    if (count < 25) return "#dc2626"; // đỏ (20-24)
    return "#7f1d1d"; // đỏ đậm (25+)
  };

  // Tạo Map để truy nhanh
  const countryCountMap = new Map<string, number>();
  data.forEach((d) => {
    countryCountMap.set(d.country, d.count);
  });

  return (
    <div className="w-full h-[500px] bg-gray-50 rounded-lg overflow-hidden relative border">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 140,
          center: [0, 20],
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup disableZoom disablePanning>
          <Geographies geography={geoUrl}>
            {/* @ts-ignore */}
            {({ geographies }) =>
              geographies.map((geo: any) => {
                const name = geo.properties.name;
                const count = countryCountMap.get(name) || 0;

                const fill = count > 0 ? getFillColor(count) : "#e5e7eb";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#d1d5db"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        outline: "none",
                        cursor: count > 0 ? "pointer" : "default",
                        // ❌ Không thay đổi fill để giữ nguyên màu gốc
                      },
                      pressed: { outline: "none" },
                    }}
                  >
                    <title>
                      {count > 0 ? `${name}: ${count} hợp đồng` : name}
                    </title>
                  </Geography>
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 border">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Số lượng hợp đồng
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#16a34a]"></div>
            <span>1 - 4</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#2563eb]"></div>
            <span>5 - 9</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#eab308]"></div>
            <span>10 - 14</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#f97316]"></div>
            <span>15 - 19</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#dc2626]"></div>
            <span>20 - 24</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#7f1d1d]"></div>
            <span>25+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
