"use client";

import React from "react";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";

type Step = {
  id: string;
  thuTu?: number;
  ten?: string;
  moTa?: string;
  ngayBatDau?: string;
  ngayKetThuc?: string;
  trangThai?: string;
  ghiChu?: string;
  canBoPhuTrachId?: string;
  chiPhi?: string;
  diaDiem?: string;
  loaiTienId?: string;
};

type Staff = {
  id: string;
  ten: string;
  anh: string;
};

type Props = {
  contractProgressSteps: Step[];
  canBo: Staff[];
  getLoaiTien: (id?: string | number | null) => string;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
};

export const ProgressTimeline: React.FC<Props> = ({
  contractProgressSteps,
  canBo,
  getLoaiTien,
}) => {
  const sortedSteps = [...contractProgressSteps].sort(
    (a, b) => (a.thuTu || 0) - (b.thuTu || 0)
  );

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        🗂️ Theo dõi ({contractProgressSteps.length} bước)
      </h3>

      <VerticalTimeline lineColor="#0ea5e9">
        {sortedSteps.map((step) => {
          const staff = canBo.find((c) => c.id === step.canBoPhuTrachId);
          return (
            <VerticalTimelineElement
              key={`step-${step.id}`}
              contentStyle={{
                background: "#e0f2fe",
                color: "#0f172a",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
              contentArrowStyle={{ borderRight: "7px solid #e0f2fe" }}
              date={`${formatDate(step.ngayBatDau)} → ${formatDate(
                step.ngayKetThuc
              )}`}
              iconStyle={{ background: "#0ea5e9", color: "#fff", padding: 0 }}
              icon={
                staff?.anh ? (
                  <img
                    src={staff.anh}
                    alt={staff.ten}
                    title={staff.ten}
                    className="rounded-full w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white text-sm">
                    ?
                  </div>
                )
              }
            >
              <h4 className="text-md font-bold mb-1">
                {step.ten || "Chưa đặt tên"}{" "}
                <span className="text-xs text-gray-500">
                  ({step.trangThai || "?"})
                </span>
              </h4>
              <h5 className="text-sm text-gray-700">
                👤 {staff?.ten || "Chưa rõ cán bộ"}
              </h5>
              <p className="text-sm text-gray-600 whitespace-pre-line mt-1">
                {step.moTa}
                {step.ghiChu ? `\n\n📝 Ghi chú: ${step.ghiChu}` : ""}
              </p>
              {step.diaDiem && (
                <p className="text-sm text-gray-600">
                  📍 Địa điểm: {step.diaDiem}
                </p>
              )}
              {step.chiPhi && (
                <p className="text-sm text-gray-600">
                  💰 Chi phí: {step.chiPhi} {getLoaiTien(step.loaiTienId)}
                </p>
              )}
            </VerticalTimelineElement>
          );
        })}
      </VerticalTimeline>
    </div>
  );
};
