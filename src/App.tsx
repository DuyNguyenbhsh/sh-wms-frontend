import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import Layout Tổng
import MainLayout from './layouts/MainLayout';

// Import Các Trang Chức Năng
import DashboardPage from './DashboardPage';       
import CreateWaybillPage from './CreateWaybillPage'; 
import DispatchPage from './DispatchPage';         
import WaybillListPage from './WaybillListPage';   
import VehiclesPage from './VehiclesPage';         
import ProductsPage from './ProductsPage';         
import MasterDataPage from './MasterDataPage';     
import PodPage from './PodPage';
import CodReconciliationPage from './CodReconciliationPage';                   
import ProcurementPage from './ProcurementPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* MainLayout bọc tất cả các trang bên trong */}
        <Route path="/" element={<MainLayout />}>
          
          {/* Dashboard là trang mặc định khi vào URL gốc (index) */}
          <Route index element={<DashboardPage />} />
          
          {/* Phân hệ Vận chuyển */}
          <Route path="create-waybill" element={<CreateWaybillPage />} />
          <Route path="dispatch" element={<DispatchPage />} />
          <Route path="waybill-list" element={<WaybillListPage />} />
          <Route path="pod" element={<PodPage />} />
          <Route path="cod-reconciliation" element={<CodReconciliationPage />} />
          
          {/* Phân hệ Master Data */}
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="master-data" element={<MasterDataPage />} />
          
          {/* Phân hệ Mua hàng */}
          <Route path="po" element={<ProcurementPage />} />

          {/* Trang 404 nếu gõ sai URL */}
          <Route path="*" element={<div style={{ padding: 50, textAlign: 'center' }}>404 - Không tìm thấy trang</div>} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;