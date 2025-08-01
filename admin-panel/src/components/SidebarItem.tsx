import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface SidebarItemProps {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  route?: string;
  children?: Array<{
    label: string;
    route: string;
  }>;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  label,
  icon: Icon,
  route,
  children,
  isExpanded = false,
  onToggle
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(isExpanded);

  const hasChildren = children && children.length > 0;
  const isActive = route ? location.pathname === route : false;
  const hasActiveChild = children?.some(child => location.pathname === child.route);

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
      if (onToggle) onToggle();
    } else if (route) {
      navigate(route);
    }
  };

  const handleChildClick = (childRoute: string) => {
    navigate(childRoute);
  };

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
          isActive || hasActiveChild
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <div className="flex items-center space-x-3">
          {Icon && <Icon className="w-5 h-5" />}
          <span>{label}</span>
        </div>
        {hasChildren && (
          <div className="flex items-center">
            {isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
        )}
      </button>

      {hasChildren && isOpen && (
        <div className="ml-6 mt-1 space-y-1">
          {children.map((child, index) => {
            const isChildActive = location.pathname === child.route;
            return (
              <button
                key={index}
                onClick={() => handleChildClick(child.route)}
                className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${
                  isChildActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="ml-6">{child.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SidebarItem; 