export default function ReportsLayout({ children }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-800 rounded-[20px]">
      <div className="flex-1 overflow-y-auto scrollbar-hide">{children}</div>
    </div>
  );
}
