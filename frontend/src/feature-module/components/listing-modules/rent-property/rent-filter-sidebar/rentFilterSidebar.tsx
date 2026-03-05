import FilterSidebar from "../../buy-property/filter-sidebar/filterSidebar";
import type { PropertyFilters } from "../../buy-property/filter-sidebar/filterSidebar";

interface RentFilterSidebarProps {
  onFilterChange?: (filters: PropertyFilters) => void;
}

const RentFilterSidebar = ({ onFilterChange }: RentFilterSidebarProps) => {
  return <FilterSidebar onFilterChange={onFilterChange} />;
};

export default RentFilterSidebar;
