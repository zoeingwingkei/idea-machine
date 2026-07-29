import { Link } from "react-router";
import { LanguageToggle } from "@/app/components/LanguageToggle";
import { useLanguage } from "@/app/i18n/LanguageContext";
import { getStrings } from "@/app/i18n/strings";
import { useDocumentMeta } from "@/app/hooks/useDocumentMeta";

const BG = "#000000";

export interface MapGroup {
  title: string;
  items: string[];
}

export interface MapPageProps {
  title: string;
  subtitle: string;
  note?: string;
  groups: MapGroup[];
}

function BulletIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0, opacity: 0.55 }}
    >
      <path
        d="M7.53162 13.7183L7.52356 12.824C7.5073 11.9844 7.46366 11.3074 7.37195 10.7578C7.24999 10.0269 7.05111 9.57418 6.77063 9.27246C6.494 8.97496 6.08454 8.76809 5.41931 8.63965C4.74723 8.5099 3.86363 8.46899 2.68445 8.46899C2.42556 8.46899 2.2157 8.25913 2.2157 8.00024C2.21579 7.74144 2.42562 7.53149 2.68445 7.53149C3.86359 7.53149 4.74724 7.49131 5.41931 7.36157C6.08466 7.23311 6.49399 7.02561 6.77063 6.72803C7.05111 6.42629 7.24999 5.97361 7.37195 5.24268C7.49418 4.50996 7.53162 3.55118 7.53162 2.28223C7.53162 2.02334 7.74148 1.81348 8.00037 1.81348C8.25912 1.81363 8.46912 2.02344 8.46912 2.28223C8.46912 3.55123 8.50655 4.50995 8.62878 5.24268C8.75073 5.97355 8.94892 6.42629 9.22937 6.72803C9.506 7.02561 9.91534 7.23311 10.5807 7.36157C11.2527 7.49132 12.1364 7.53149 13.3156 7.53149C13.5744 7.53149 13.7842 7.74144 13.7843 8.00024C13.7843 8.25913 13.5744 8.46899 13.3156 8.46899C12.1364 8.469 11.2528 8.50989 10.5807 8.63965C9.91541 8.7681 9.506 8.97492 9.22937 9.27246C8.9489 9.57417 8.75075 10.027 8.62878 10.7578C8.50654 11.4905 8.46912 12.4493 8.46912 13.7183L8.45959 13.8127C8.41605 14.0264 8.22689 14.1869 8.00037 14.187C7.77375 14.187 7.58475 14.0265 7.54114 13.8127L7.53162 13.7183ZM7.99963 6.49658C7.86381 6.82806 7.68816 7.11873 7.45764 7.3667C7.20081 7.64298 6.89232 7.84615 6.53699 8.00024C6.89238 8.15434 7.20078 8.3582 7.45764 8.63452C7.68799 8.88237 7.86386 9.17265 7.99963 9.50391C8.13541 9.17255 8.31197 8.88243 8.54236 8.63452C8.79904 8.3584 9.10721 8.15431 9.46228 8.00024C9.10726 7.84619 8.79901 7.64279 8.54236 7.3667C8.31181 7.11867 8.13546 6.82815 7.99963 6.49658Z"
        fill="white"
      />
    </svg>
  );
}

// Shared layout for the three "map" pages (space / form / twist). Each page
// just normalizes its own JSON into { title, subtitle, note, groups } — this
// component stays purely presentational so all three stay visually identical.
export function MapPage({ title, subtitle, groups }: MapPageProps) {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  useDocumentMeta(`${title} | The Idea Machine`, subtitle);
  return (
    <>
      <style>{`
        body { overflow-x: hidden; background: ${BG}; }
        .map-page-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }
        .map-page-container {
          padding: 96px 64px 96px;
        }
        @media (max-width: 900px) {
          .map-page-container { padding: 72px 32px 72px; }
        }
        @media (max-width: 560px) {
          .map-page-container { padding: 48px 20px 56px; }
        }
        .lang-toggle-btn { transition: color 0.2s ease, border-color 0.2s ease; }
        .lang-toggle-btn:hover { color: white; border-color: rgba(255,255,255,0.6); }
      `}</style>

      <LanguageToggle />

      <div
        style={{
          minHeight: "100vh",
          backgroundColor: BG,
          color: "white",
        }}
      >
        <div
          className="map-page-container"
          style={{ maxWidth: 1180, margin: "0 auto" }}
        >
          <Link
            to="/"
            style={{
              display: "inline-block",
              marginBottom: 32,
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              color: "rgba(255,255,255,0.55)",
              textDecoration: "none",
              letterSpacing: 0.3,
            }}
          >
            {t.backToMachine}
          </Link>

          <h1
            style={{
              fontFamily: "'Limelight', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(26px, 4vw, 32px)",
              color: "white",
              margin: "0 0 20px",
            }}
          >
            {title}
          </h1>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 40,
              maxWidth: 780,
            }}
          >
            <p className="text-body" style={{ margin: 0 }}>
              {subtitle}
            </p>
          </div>

          <div className="map-page-grid">
            {groups.map((group) => (
              <div
                key={group.title}
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  padding: "16px 16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Limelight', sans-serif",
                    fontWeight: 400,
                    fontSize: 22,
                    color: "white",
                    margin: 0,
                  }}
                >
                  {group.title}
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {group.items.map((item) => (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <BulletIcon />
                      <p
                        style={{
                          fontFamily: "'Arvo', serif",
                          fontWeight: 400,
                          fontSize: 15,
                          color: "white",
                          margin: 0,
                          wordBreak: "break-word",
                        }}
                      >
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
