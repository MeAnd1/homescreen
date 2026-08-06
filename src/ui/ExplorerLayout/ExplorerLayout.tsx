import type { ReactNode } from "react";
import favouritesIcon from "../../assets/icons/favourites.webp";
import "./ExplorerLayout.css";

export interface ExplorerTab {
  label: string;
  active?: boolean;
}

export interface ExplorerSidebarItem {
  label: string;
  active?: boolean;
  star?: boolean;
  onClick?: () => void;
}

interface ExplorerLayoutProps {
  tabs?: ExplorerTab[];
  sidebar?: ExplorerSidebarItem[];
  statusText?: string;
  children: ReactNode;
}

/**
 * The Windows-10 explorer chrome — tabs, navigation pane, status bar — as a
 * layout that renders INSIDE a window body. It knows nothing about windows.
 */
function ExplorerLayout({ tabs, sidebar, statusText, children }: ExplorerLayoutProps) {
  return (
    <>
      {tabs && tabs.length > 0 && (
        <div className="explorer-toolbar">
          <div className="explorer-toolbar-tabs">
            {tabs.map((tab) => (
              <span
                key={tab.label}
                className={`explorer-tab${tab.active ? " active" : ""}`}
              >
                {tab.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="explorer-body">
        {sidebar && sidebar.length > 0 && (
          <div className="explorer-sidebar">
            {sidebar.map((item) => {
              const className = `explorer-sidebar-item${item.active ? " active" : ""}${item.star ? " star" : ""}`;
              const content = (
                <>
                  {item.star && <img className="explorer-star" src={favouritesIcon} alt="" />}
                  {item.label}
                </>
              );
              // Today every entry is decorative (phase 4.3 is deferred), and a
              // decorative entry must NOT be a tab stop. The moment one gains a
              // handler it becomes a real button, so it can never end up as a
              // keyboard-unreachable `div onClick`.
              return item.onClick ? (
                <button
                  key={item.label}
                  type="button"
                  className={className}
                  aria-pressed={item.active}
                  onClick={item.onClick}
                >
                  {content}
                </button>
              ) : (
                <div key={item.label} className={className}>
                  {content}
                </div>
              );
            })}
          </div>
        )}

        <div className="explorer-content">{children}</div>
      </div>

      {statusText && (
        <div className="explorer-statusbar">
          <span>{statusText}</span>
        </div>
      )}
    </>
  );
}

export default ExplorerLayout;
