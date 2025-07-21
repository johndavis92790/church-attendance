import { Nav } from "react-bootstrap";

interface TabNavigationProps {
  activeTab: string;
  onTabSelect: (tab: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabSelect,
}) => {
  return (
    <Nav
      variant="tabs"
      className="mb-4"
      activeKey={activeTab}
      onSelect={(k) => k && onTabSelect(k)}
    >
      <Nav.Item>
        <Nav.Link eventKey="attendance">Attendance</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="users">Manage Users</Nav.Link>
      </Nav.Item>
    </Nav>
  );
};

export default TabNavigation;
