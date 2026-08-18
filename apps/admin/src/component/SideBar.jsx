import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  LogOut,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Users,
  ClipboardCheck,
  BookUser,
  FileText,
  CalendarClock,
  Wallet,
  Megaphone,
  Bus,
  Map,
  UserCheck,
  CalendarCheck,
  BadgeDollarSign,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Landmark,
  ListTree,
  Receipt,
  Link2,
  Lock,
  Scale,
  Users2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { canSee, canEditScope, hasAnyAction } from '@/utils/permissions';
import { useAuth } from '@/hooks/useAuth';

// `key` controls which menus appear in the role form / are stored on the role.
// `base` is the view action used by canSee() — when set, sidebar visibility falls
// back to canSee(role, base) so own-scope users see the menu even if the admin
// only granted them view-own-X.
const navigationItems = [
  // Order is by how often a school actually touches each screen, grouped into
  // sections (`section` → sidebar heading). Staff and Roles are not here on
  // purpose: they moved under User Management in the topbar
  // (/dashboard/user-management), since they administer system access rather
  // than school operations. Branches, Branch Profile and WhatsApp likewise
  // moved to Business Settings (/dashboard/business-settings), and Billing to
  // /dashboard/billing — all reached from the topbar menu.
  {
    section: 'sectionSchool',
    labelKey: 'students',
    iconComponent: Users,
    key: 'student',
    base: 'view-student',
    hasSubmenu: false,
    path: '/dashboard/school/students',
  },
  {
    // Grouped: both are "who was present today", and the parent shows whenever
    // either register is granted (see isItemVisible).
    section: 'sectionSchool',
    labelKey: 'attendance',
    iconComponent: ClipboardCheck,
    key: 'attendance',
    hasSubmenu: true,
    path: '/dashboard/school/attendance',
    submenu: [
      {
        labelKey: 'studentAttendance',
        iconComponent: ClipboardCheck,
        key: 'attendance',
        base: 'view-attendance',
        path: '/dashboard/school/attendance',
      },
      {
        labelKey: 'staffAttendance',
        iconComponent: CalendarCheck,
        key: 'staff-attendance',
        base: 'view-staff-attendance',
        path: '/dashboard/school/staff-attendance',
      },
    ],
  },
  {
    section: 'sectionSchool',
    labelKey: 'timetable',
    iconComponent: CalendarClock,
    key: 'timetable',
    base: 'view-timetable',
    hasSubmenu: false,
    path: '/dashboard/school/timetable',
  },
  {
    section: 'sectionSchool',
    labelKey: 'homework',
    iconComponent: ClipboardList,
    key: 'homework',
    base: 'view-homework',
    hasSubmenu: false,
    path: '/dashboard/school/homework',
  },
  {
    section: 'sectionSchool',
    labelKey: 'exams',
    iconComponent: FileText,
    key: 'exam',
    base: 'view-exam',
    hasSubmenu: false,
    path: '/dashboard/school/exams',
  },
  {
    section: 'sectionSchool',
    // Configure-once academic structure — grouped so the daily-use items above
    // stay at the top level.
    labelKey: 'academicSetup',
    iconComponent: GraduationCap,
    hasSubmenu: true,
    path: '/dashboard/school/classes',
    submenu: [
      {
        labelKey: 'classes',
        iconComponent: GraduationCap,
        key: 'class',
        base: 'view-class',
        path: '/dashboard/school/classes',
      },
      {
        labelKey: 'subjects',
        iconComponent: BookOpen,
        key: 'subject',
        base: 'view-subject',
        path: '/dashboard/school/subjects',
      },
      {
        labelKey: 'teacherAssignments',
        iconComponent: BookUser,
        key: 'teaching-assignment',
        base: 'view-teaching-assignment',
        path: '/dashboard/school/teacher-assignments',
      },
    ],
  },
  {
    section: 'sectionFinance',
    labelKey: 'fees',
    iconComponent: Wallet,
    key: 'fee',
    base: 'view-fee',
    hasSubmenu: false,
    path: '/dashboard/school/fees',
  },
  {
    section: 'sectionFinance',
    labelKey: 'accounting',
    iconComponent: Landmark,
    key: 'accounting',
    hasSubmenu: true,
    path: '/dashboard/school/accounting',
    submenu: [
      {
        labelKey: 'chartOfAccounts',
        iconComponent: ListTree,
        key: 'account',
        base: 'view-account',
        path: '/dashboard/school/accounting/accounts',
      },
      {
        labelKey: 'journalEntries',
        iconComponent: BookOpen,
        key: 'journal',
        base: 'view-journal',
        path: '/dashboard/school/accounting/journals',
      },
      {
        labelKey: 'accountLedger',
        iconComponent: Receipt,
        key: 'journal',
        base: 'view-journal',
        path: '/dashboard/school/accounting/ledger',
      },
      {
        labelKey: 'accountMapping',
        iconComponent: Link2,
        key: 'account-mapping',
        base: 'view-account-mapping',
        path: '/dashboard/school/accounting/mapping',
      },
      {
        labelKey: 'accountingPeriods',
        iconComponent: Lock,
        key: 'accounting-period',
        base: 'view-accounting-period',
        path: '/dashboard/school/accounting/periods',
      },
    ],
  },
  {
    section: 'sectionFinance',
    labelKey: 'staffSalary',
    iconComponent: BadgeDollarSign,
    key: 'staff-salary',
    hasSubmenu: true,
    path: '/dashboard/school/staff-salary',
    submenu: [
      {
        labelKey: 'salaryDashboard',
        iconComponent: BadgeDollarSign,
        key: 'salary-dashboard',
        path: '/dashboard/school/staff-salary/dashboard',
        // Branch-aggregate view — needs the menu AND a non-own payslip grant.
        canAccess: (role, menus) =>
          menus.includes('salary-dashboard') && canEditScope(role, 'view-payslip'),
      },
      {
        labelKey: 'salaryStructures',
        iconComponent: BadgeDollarSign,
        key: 'salary-structure',
        base: 'view-staff-salary',
        path: '/dashboard/school/staff-salary/structures',
      },
      {
        labelKey: 'payslips',
        iconComponent: BadgeDollarSign,
        key: 'payslip',
        base: 'view-payslip',
        path: '/dashboard/school/staff-salary/payslips',
      },
      {
        labelKey: 'policy',
        iconComponent: BadgeDollarSign,
        key: 'salary-policy',
        base: 'view-staff-salary-policy',
        path: '/dashboard/school/staff-salary/policy',
      },
    ],
  },
  {
    section: 'sectionOperations',
    labelKey: 'transport',
    iconComponent: Bus,
    key: 'transport',
    hasSubmenu: true,
    path: '/dashboard/school/transport',
    submenu: [
      {
        labelKey: 'vehicles',
        iconComponent: Bus,
        key: 'vehicle',
        base: 'view-vehicle',
        path: '/dashboard/school/transport/vehicles',
      },
      {
        labelKey: 'routes',
        iconComponent: Map,
        key: 'route',
        base: 'view-route',
        path: '/dashboard/school/transport/routes',
      },
      {
        labelKey: 'assignments',
        iconComponent: UserCheck,
        key: 'transport-assignment',
        base: 'view-transport-assignment',
        path: '/dashboard/school/transport/assignments',
      },
    ],
  },
  {
    section: 'sectionOperations',
    labelKey: 'announcements',
    iconComponent: Megaphone,
    key: 'announcement',
    base: 'view-announcement',
    hasSubmenu: false,
    path: '/dashboard/school/announcements',
  },
  {
    section: 'sectionInsights',
    labelKey: 'reports',
    iconComponent: BarChart3,
    key: 'report',
    hasSubmenu: true,
    path: '/dashboard/school/reports',
    submenu: [
      {
        labelKey: 'reportStudentFeeDefaulter',
        iconComponent: TrendingDown,
        key: 'report-student-fee-defaulter',
        path: '/dashboard/school/reports/defaulters',
      },
      {
        labelKey: 'reportStudentProgress',
        iconComponent: TrendingUp,
        key: 'report-student-progress',
        path: '/dashboard/school/reports/progress',
        canAccess: (role) =>
          role?.isPredefined || hasAnyAction(role, ['view-student', 'view-all-branch-student']),
      },
      // Financial reports — one entry per statement instead of in-page tabs.
      {
        labelKey: 'reportTrialBalance',
        iconComponent: Scale,
        key: 'financial-report',
        base: 'view-financial-report',
        path: '/dashboard/school/accounting/reports/trial-balance',
      },
      {
        labelKey: 'reportIncomeStatement',
        iconComponent: TrendingUp,
        key: 'financial-report',
        base: 'view-financial-report',
        path: '/dashboard/school/accounting/reports/income-statement',
      },
      {
        labelKey: 'reportBalanceSheet',
        iconComponent: Landmark,
        key: 'financial-report',
        base: 'view-financial-report',
        path: '/dashboard/school/accounting/reports/balance-sheet',
      },
      {
        labelKey: 'reportPartyLedger',
        iconComponent: Users2,
        key: 'financial-report',
        base: 'view-financial-report',
        path: '/dashboard/school/accounting/reports/party',
      },
    ],
  },
];

export const Sidebar = ({
  user = {},
  menus = [],
  actions: _actions = [],
  isMobileOpen = false,
  onMobileClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const pathname = usePathname();
  const t = useTranslations('sidebar');
  const { logout } = useAuth();

  // Auto-close the mobile drawer when navigating to a new route.
  useEffect(() => {
    if (isMobileOpen && onMobileClose) onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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

  const isParentActive = (item) =>
    !!item.submenu?.some((sub) => pathname === sub.path || pathname.startsWith(sub.path + '/'));

  // Visibility = (admin) OR (menu key granted) OR (any scope of base action granted).
  // Falling back to canSee(base) means own-scope users see the menu even if the
  // admin only ticked view-own-X without ticking the base menu.
  // A submenu can supply its own canAccess(role, menus) for stricter rules.
  const subVisible = (sub) => {
    if (sub.canAccess) return sub.canAccess(user?.role, menus);
    return menus.includes(sub.key) || (sub.base && canSee(user?.role, sub.base));
  };

  const isItemVisible = (item) => {
    if (user?.role?.isPredefined) return true;
    if (item.submenu) return item.submenu.some(subVisible);
    return menus.includes(item.key) || (item.base && canSee(user?.role, item.base));
  };

  // First visible item of each section — that row gets the section heading
  // above it, so a heading never shows for a section the user cannot see.
  const sectionHeadIndex = {};
  navigationItems.forEach((item, idx) => {
    if (!item.section || sectionHeadIndex[item.section] !== undefined) return;
    if (isItemVisible(item)) sectionHeadIndex[item.section] = idx;
  });

  useEffect(() => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      navigationItems.forEach((item, idx) => {
        if (item.hasSubmenu && isParentActive(item)) next.add(idx);
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
      {/* Mobile backdrop */}
      <div
        onClick={onMobileClose}
        className={`md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity print:hidden ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        ref={sidebarRef}
        style={{ width: `${sidebarWidth}px`, height: '100vh' }}
        className={`bg-teal-600 dark:bg-slate-900 p-4 flex-shrink-0 transition-transform md:transition-none flex flex-col overscroll-contain fixed md:sticky top-0 left-0 z-50 md:self-start print:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div
          onMouseDown={startResizing}
          className="hidden md:block absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-teal-500 dark:hover:bg-slate-700 transition-colors z-50"
        />

        <div className="flex items-center justify-between mb-6">
          {!isCollapsed ? (
            <Link href="/dashboard/school" className="flex items-center gap-3 no-underline">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
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
              <h2 className="text-white font-bold text-xl truncate">{t('schoolPortal')}</h2>
            </Link>
          ) : (
            <Link
              href="/dashboard/school"
              className="w-10 h-10 bg-white rounded-lg flex items-center justify-center"
            >
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
            </Link>
          )}
          <button
            onClick={() => {
              setIsCollapsed(!isCollapsed);
              setSidebarWidth(isCollapsed ? 240 : 80);
            }}
            className="w-9 h-9 flex items-center justify-center text-white hover:bg-teal-700 dark:hover:bg-slate-800 rounded-md transition-colors flex-shrink-0"
          >
            {isCollapsed ? (
              <ChevronDown className="w-5 h-5 rotate-90" />
            ) : (
              <ChevronUp className="w-5 h-5 -rotate-90" />
            )}
          </button>
        </div>

        <nav className="flex flex-col items-start w-full flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {navigationItems.map((item, index) => {
            if (!isItemVisible(item)) return null;
            const itemIsActive = item.hasSubmenu ? isParentActive(item) : isActive(item.path);
            const itemLabel = t(item.labelKey);
            const showSectionHeading = sectionHeadIndex[item.section] === index;
            return (
              <div key={index} className="w-full">
                {showSectionHeading &&
                  (isCollapsed ? (
                    <div className="my-2 mx-auto w-6 border-t border-white/20" />
                  ) : (
                    <div className="px-7 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/50">
                      {t(item.section)}
                    </div>
                  ))}
                {item.hasSubmenu ? (
                  <button
                    onClick={() => toggleExpand(index)}
                    className={`w-full h-14 ${
                      isCollapsed ? 'justify-center px-0' : 'justify-start px-0'
                    } rounded-full transition-colors hover:bg-teal-700 dark:hover:bg-slate-800 ${
                      itemIsActive ? 'bg-teal-700 dark:bg-slate-800' : 'bg-transparent'
                    } flex items-center`}
                  >
                    <div
                      className={`flex items-center gap-2.5 ${isCollapsed ? 'px-3' : 'px-7'} w-full overflow-hidden`}
                    >
                      {item.iconComponent ? (
                        <item.iconComponent
                          className="w-5 h-5 flex-shrink-0"
                          style={{ color: itemIsActive ? '#FFDC34' : '#ffffff' }}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className="w-5 h-5 flex-shrink-0"
                          alt={itemLabel}
                          src={item.icon}
                          style={
                            itemIsActive
                              ? {
                                  filter:
                                    'brightness(0) saturate(100%) invert(86%) sepia(38%) saturate(1860%) hue-rotate(348deg) brightness(102%) contrast(101%)',
                                }
                              : undefined
                          }
                        />
                      )}
                      {!isCollapsed && (
                        <>
                          <span
                            className="flex-1 text-left font-medium text-base truncate"
                            style={{ color: itemIsActive ? '#FFDC34' : '#ffffff' }}
                            title={itemLabel}
                          >
                            {itemLabel}
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
                  <Link
                    href={item.path}
                    className={`w-full h-14 ${
                      isCollapsed ? 'justify-center px-0' : 'justify-start px-0'
                    } rounded-full transition-colors hover:bg-teal-700 ${
                      itemIsActive ? 'bg-teal-700' : 'bg-transparent'
                    } flex items-center cursor-pointer no-underline`}
                  >
                    <div
                      className={`flex items-center gap-2.5 ${isCollapsed ? 'px-3' : 'px-7'} w-full overflow-hidden`}
                    >
                      {item.iconComponent ? (
                        <item.iconComponent
                          className="w-5 h-5 flex-shrink-0"
                          style={{ color: itemIsActive ? '#FFDC34' : '#ffffff' }}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className="w-5 h-5 flex-shrink-0"
                          alt={itemLabel}
                          src={item.icon}
                          style={
                            itemIsActive
                              ? {
                                  filter:
                                    'brightness(0) saturate(100%) invert(86%) sepia(38%) saturate(1860%) hue-rotate(348deg) brightness(102%) contrast(101%)',
                                }
                              : undefined
                          }
                        />
                      )}
                      {!isCollapsed && (
                        <span
                          className={`flex-1 text-left font-medium text-base truncate ${
                            itemIsActive ? 'text-yellow-300' : 'text-white'
                          }`}
                          title={itemLabel}
                        >
                          {itemLabel}
                        </span>
                      )}
                    </div>
                  </Link>
                )}

                {!isCollapsed && item.hasSubmenu && expandedItems.has(index) && (
                  <div className="ml-12 mt-2 mb-2 space-y-1">
                    {item.submenu
                      ?.filter((sub) => user?.role?.isPredefined || subVisible(sub))
                      .map((sub) => {
                        const subActive =
                          pathname === sub.path || pathname.startsWith(sub.path + '/');
                        const SubIcon = sub.iconComponent;
                        const subLabel = t(sub.labelKey);
                        return (
                          <Link
                            key={sub.path}
                            href={sub.path}
                            className={`w-full h-10 flex items-center gap-2 rounded-md px-4 transition-colors no-underline ${
                              subActive
                                ? 'bg-teal-700/80 dark:bg-slate-800'
                                : 'hover:bg-teal-700/60 dark:hover:bg-slate-800/80'
                            }`}
                          >
                            {SubIcon && (
                              <SubIcon
                                className="w-4 h-4 flex-shrink-0"
                                style={{
                                  color: subActive ? '#FFDC34' : '#ffffff',
                                }}
                              />
                            )}
                            <span
                              className="truncate text-sm"
                              title={subLabel}
                              style={{
                                color: subActive ? '#FFDC34' : '#ffffff',
                              }}
                            >
                              {subLabel}
                            </span>
                          </Link>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/20">
          <button
            onClick={logout}
            className={`w-full h-14 ${
              isCollapsed ? 'justify-center px-0' : 'justify-start px-0'
            } rounded-full transition-colors hover:bg-teal-700 dark:hover:bg-slate-800 bg-transparent flex items-center`}
          >
            <div
              className={`flex items-center gap-2.5 ${isCollapsed ? 'px-10' : 'px-7'} overflow-hidden w-full`}
            >
              <LogOut className="w-5 h-5 flex-shrink-0 text-white" />
              {!isCollapsed && (
                <span className="font-medium text-base text-white truncate">{t('logout')}</span>
              )}
            </div>
          </button>
        </div>
      </aside>

      {/* Horizontal line from sidebar to end of screen */}
      <div
        className="hidden md:block bg-teal-600 dark:bg-slate-900 fixed top-0 h-25.5 z-0"
        style={{
          left: `${sidebarWidth}px`,
          right: 0,
        }}
      />

      {/* Vertical line on the right end */}
      <div className="hidden md:block bg-teal-600 dark:bg-slate-900 fixed top-0 right-0 w-25.5 h-full z-0" />
    </>
  );
};
