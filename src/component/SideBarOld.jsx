import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationItems = [
  {
    label: 'Dashboard',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/bold.svg',
    key: 'dashboard',
    hasSubmenu: false,
    path: '/dashboard/system',
  },
  {
    label: 'Organizations',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/frame-1.svg',
    key: 'organizations',
    hasSubmenu: false,
    path: '/dashboard/system/organizations',
  },
  {
    label: 'Fees',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/capa-1-1.svg',
    key: 'fees',
    hasSubmenu: true,
    path: '/dashboard',
  },
  {
    label: 'Online Course',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/layer-18.svg',
    key: 'online_course',
    hasSubmenu: false,
    path: '/dashboard',
  },
  {
    label: 'Zoom Live Class',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/glyph-1.svg',
    key: 'zoom_class',
    hasSubmenu: false,
    path: '/dashboard',
  },
  {
    label: 'Gmeet Live Class',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/frame.svg',
    key: 'gmeet_class',
    hasSubmenu: false,
    path: '/dashboard',
  },
  {
    label: 'Class Timetable',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/layer-2.svg',
    key: 'timetable',
    hasSubmenu: false,
    path: '/dashboard',
  },
  {
    label: 'Lesson Plan',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/solid.svg',
    key: 'lesson_plan',
    hasSubmenu: false,
    path: '/dashboard',
  },
  {
    label: 'Syllabus Status',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/frame-3.svg',
    key: 'syllabus',
    hasSubmenu: false,
    path: '/dashboard',
  },
  {
    label: 'Homework',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/layer-1-4.svg',
    key: 'homework',
    hasSubmenu: false,
    path: '/dashboard',
  },
  {
    label: 'Online Exam',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/layer-1-3.svg',
    key: 'online_exam',
    hasSubmenu: false,
    path: '/dashboard',
  },
  {
    label: 'Apply Leave',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/frame-2.svg',
    key: 'apply_leave',
    hasSubmenu: false,
    path: '/dashboard',
  },
  {
    label: 'Visitor Book',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/layer-1-5.svg',
    key: 'visitor_book',
    hasSubmenu: false,
    path: '/dashboard',
  },
  {
    label: 'Attendance',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/layer-1-6.svg',
    key: 'attendance',
    hasSubmenu: false,
    path: '/dashboard',
  },
  {
    label: 'Cbse Examination',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/frame-4.svg',
    key: 'cbse_exam',
    hasSubmenu: false,
    path: '/dashboard',
  },
  {
    label: 'Notice Board',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/layer-1-1.svg',
    key: 'notice_board',
    hasSubmenu: false,
    path: '/dashboard',
  },
  {
    label: 'Teachers Reviews',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/capa-1.svg',
    key: 'teacher_reviews',
    hasSubmenu: false,
    path: '/dashboard',
  },
  {
    label: 'Library',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/layer-1.svg',
    key: 'library',
    hasSubmenu: false,
    path: '/dashboard',
  },
  {
    label: 'Transport Routes',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/glyph.svg',
    key: 'transport',
    hasSubmenu: false,
    path: '/dashboard',
  },
  {
    label: 'Hostel Rooms',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/layer-1-2.svg',
    key: 'hostel',
    hasSubmenu: false,
    path: '/dashboard',
  },
];

export const Sidebar = ({ user = {}, actionList = [] }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const pathname = usePathname();

  const toggleExpand = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const isActive = (itemPath) => {
    return pathname === itemPath;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= 80 && newWidth <= 400) {
        setSidebarWidth(newWidth);
        if (newWidth < 150) {
          setIsCollapsed(true);
        } else {
          setIsCollapsed(false);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <>
      <aside
        ref={sidebarRef}
        style={{ width: `${sidebarWidth}px` }}
        className="bg-teal-600 min-h-screen p-4 flex-shrink-0 transition-none flex flex-col relative"
      >
        <div
          onMouseDown={startResizing}
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-teal-500 transition-colors z-50"
        />

        <div className="flex items-center justify-between mb-6">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#00918e" />
                  <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="#00918e" />
                </svg>
              </div>
              <h2 className="text-white font-bold text-xl truncate">School Portal</h2>
            </div>
          ) : (
            <div className="w-10 h-10 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#00918e" />
                <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="#00918e" />
              </svg>
            </div>
          )}
          <button
            onClick={() => {
              setIsCollapsed(!isCollapsed);
              setSidebarWidth(isCollapsed ? 240 : 80);
            }}
            className="w-9 h-9 flex items-center justify-center text-white hover:bg-teal-700 rounded-md transition-colors flex-shrink-0"
          >
            {isCollapsed ? (
              <ChevronDown className="w-5 h-5 rotate-90" />
            ) : (
              <ChevronUp className="w-5 h-5 -rotate-90" />
            )}
          </button>
        </div>

        <nav className="flex flex-col items-start w-full flex-1 overflow-y-auto overflow-x-hidden">
          {navigationItems.map((item, index) => {
            if (user?.role?.name?.toLowerCase() !== 'super-admin' && !actionList.includes(item.key))
              return null;

            const itemIsActive = isActive(item.path);

            return (
              <div key={index} className="w-full">
                {item.hasSubmenu ? (
                  <button
                    onClick={() => toggleExpand(index)}
                    className={`w-full h-14 ${
                      isCollapsed ? 'justify-center px-0' : 'justify-start px-0'
                    } rounded-full transition-colors hover:bg-teal-700 ${
                      itemIsActive ? 'bg-teal-700' : 'bg-transparent'
                    } flex items-center`}
                  >
                    <div
                      className={`flex items-center gap-2.5 ${isCollapsed ? 'px-3' : 'px-7'} w-full overflow-hidden`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="w-5 h-5 flex-shrink-0" alt={item.label} src={item.icon} />
                      {!isCollapsed && (
                        <>
                          <span
                            className={`flex-1 text-left font-medium text-base truncate ${
                              itemIsActive ? 'text-yellow-300' : 'text-white'
                            }`}
                            title={item.label}
                          >
                            {item.label}
                          </span>
                          <span className="text-white flex-shrink-0">
                            {expandedItems.has(index) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                ) : (
                  <Link href={item.path}>
                    <button
                      className={`w-full h-14 ${
                        isCollapsed ? 'justify-center px-0' : 'justify-start px-0'
                      } rounded-full transition-colors hover:bg-teal-700 ${
                        itemIsActive ? 'bg-teal-700' : 'bg-transparent'
                      } flex items-center`}
                    >
                      <div
                        className={`flex items-center gap-2.5 ${isCollapsed ? 'px-3' : 'px-7'} w-full overflow-hidden`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="w-5 h-5 flex-shrink-0" alt={item.label} src={item.icon} />
                        {!isCollapsed && (
                          <span
                            className={`flex-1 text-left font-medium text-base truncate ${
                              itemIsActive ? 'text-yellow-300' : 'text-white'
                            }`}
                            title={item.label}
                          >
                            {item.label}
                          </span>
                        )}
                      </div>
                    </button>
                  </Link>
                )}

                {!isCollapsed && item.hasSubmenu && expandedItems.has(index) && (
                  <div className="ml-12 mt-2 mb-2 space-y-2">
                    <button className="w-full h-10 flex items-center justify-start text-white/80 hover:bg-teal-700/60 rounded-md px-4 transition-colors">
                      <span className="truncate" title="Submenu Item 1">
                        Submenu Item 1
                      </span>
                    </button>
                    <button className="w-full h-10 flex items-center justify-start text-white/80 hover:bg-teal-700/60 rounded-md px-4 transition-colors">
                      <span className="truncate" title="Submenu Item 2">
                        Submenu Item 2
                      </span>
                    </button>
                  </div>
                )}

                {(index === 2 || index === 9 || index === 14) && <div className="my-0" />}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/20">
          <button
            className={`w-full h-14 ${
              isCollapsed ? 'justify-center px-0' : 'justify-start px-0'
            } rounded-full transition-colors hover:bg-teal-700 bg-transparent flex items-center`}
          >
            <div
              className={`flex items-center gap-2.5 ${isCollapsed ? 'px-10' : 'px-7'} overflow-hidden w-full`}
            >
              <LogOut className="w-5 h-5 flex-shrink-0 text-white" />
              {!isCollapsed && (
                <span className="font-medium text-base text-white truncate">Logout</span>
              )}
            </div>
          </button>
        </div>
      </aside>

      {/* Horizontal line from sidebar to end of screen */}
      <div
        className="bg-teal-600 fixed top-0 h-1.5 bg-teal-500 z-0"
        style={{
          left: `${sidebarWidth}px`,
          right: 0,
        }}
      />

      {/* Vertical line on the right end */}
      <div className="bg-teal-600 fixed top-0 right-0 w-1.5 h-full bg-teal-500 z-0" />
    </>
  );
};
