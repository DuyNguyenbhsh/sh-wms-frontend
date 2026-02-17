import { useEffect, useState, useMemo } from 'react';
import { 
  Table, Button, Card, Tabs, Form, Input, Modal, message, 
  Popconfirm, Tag, Space, Tooltip, Upload, Row, Col 
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, ShopOutlined, ClockCircleOutlined, 
  EditOutlined, SearchOutlined, CloudUploadOutlined,
  FileExcelOutlined, BuildOutlined, EnvironmentOutlined, CheckCircleOutlined,
  BankOutlined // <--- Icon mới
} from '@ant-design/icons';
import axios from 'axios';
import * as XLSX from 'xlsx';

const MasterDataPage = () => {
  const [activeTab, setActiveTab] = useState('providers');

  return (
    <Card 
      title="QUẢN LÝ DANH MỤC HỆ THỐNG" 
      bordered={false}
      style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
    >
      <Tabs
        type="card"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'providers',
            label: <span><ShopOutlined /> Đơn vị chuyển phát</span>,
            children: <GenericCategory apiEndpoint="providers" title="Đơn vị" color="blue" />,
          },
          {
            key: 'types',
            label: <span><ClockCircleOutlined /> Loại hình vận chuyển</span>,
            children: <GenericCategory apiEndpoint="types" title="Loại hình" color="geekblue" />,
          },
          {
            key: 'statuses',
            label: <span><CheckCircleOutlined /> Trạng thái vận chuyển</span>,
            children: <GenericCategory apiEndpoint="statuses" title="Trạng thái" color="green" />,
          },
          {
            key: 'routes',
            label: <span><EnvironmentOutlined /> Tuyến vận chuyển</span>,
            children: <GenericCategory apiEndpoint="routes" title="Tuyến" color="cyan" />,
          },
          {
            key: 'cargos',
            label: <span><BuildOutlined /> Dạng hàng hóa</span>,
            children: <GenericCategory apiEndpoint="cargos" title="Dạng hàng" color="purple" />,
          },
          // --- TAB MỚI: ĐƠN VỊ HÀNH CHÍNH 2 CẤP ---
          {
            key: 'admin-units',
            label: <span><BankOutlined /> Đơn vị hành chính</span>,
            children: <AdministrativeUnits />,
          },
        ]}
      />
    </Card>
  );
};

// --- COMPONENT RIÊNG: ĐƠN VỊ HÀNH CHÍNH (Tỉnh -> Xã) ---
const AdministrativeUnits = () => {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
  
  // Load Tỉnh ngay khi mở Tab
  useEffect(() => {
    axios.get('http://localhost:3000/master-data/provinces')
      .then(res => setProvinces(res.data))
      .catch(() => message.error('Không tải được danh sách Tỉnh'));
  }, []);

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      {/* CỘT TRÁI: DANH SÁCH TỈNH */}
      <Card title="Tỉnh / Thành phố" style={{ width: 350, minHeight: 500 }}>
         <div style={{ marginBottom: 10, color: '#888', fontSize: 12 }}>* Chọn Tỉnh để xem/thêm Xã</div>
         <Table 
            dataSource={provinces}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ y: 400 }}
            onRow={(record) => ({
              onClick: () => setSelectedProvinceId(record.id),
              style: { cursor: 'pointer', background: record.id === selectedProvinceId ? '#e6f7ff' : 'transparent' }
            })}
            columns={[
              { title: 'Mã', dataIndex: 'code', width: 80, render: (t:string) => <Tag color="blue">{t}</Tag> },
              { title: 'Tên Tỉnh', dataIndex: 'name', render: (t:string) => <b>{t}</b> }
            ]}
         />
      </Card>

      {/* CỘT PHẢI: DANH SÁCH XÃ/PHƯỜNG */}
      <Card title={selectedProvinceId ? "Danh sách Phường / Xã trực thuộc" : "..."} style={{ flex: 1, minHeight: 500 }}>
         {selectedProvinceId ? (
            <GenericCategory 
               // Quan trọng: Key giúp React reset component khi đổi Tỉnh
               key={selectedProvinceId} 
               apiEndpoint={`communes?provinceId=${selectedProvinceId}`} 
               title="Phường/Xã" 
               color="orange"
               // Truyền ID tỉnh vào để khi Tạo mới nó tự gắn vào Tỉnh này
               extraParams={{ provinceId: selectedProvinceId }} 
            />
         ) : (
            <div style={{ textAlign: 'center', padding: 50, color: '#999' }}>
               <EnvironmentOutlined style={{ fontSize: 40, marginBottom: 10, color: '#ccc' }} />
               <p>Vui lòng chọn một Tỉnh ở bên trái</p>
            </div>
         )}
      </Card>
    </div>
  );
};

// --- COMPONENT CHUNG (Đã nâng cấp) ---
const GenericCategory = ({ 
    apiEndpoint, title, color, extraParams = {} 
}: { 
    apiEndpoint: string, title: string, color: string, extraParams?: any 
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  // Load dữ liệu (Chạy lại khi apiEndpoint thay đổi)
  const fetchData = async () => {
    setLoading(true);
    try {
      // Xử lý URL (nếu có query param sẵn thì dùng dấu &)
      const url = apiEndpoint.includes('?') 
        ? `http://localhost:3000/master-data/${apiEndpoint}`
        : `http://localhost:3000/master-data/${apiEndpoint}`;
      
      const res = await axios.get(url);
      setData(res.data);
    } catch (error) { message.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [apiEndpoint]);

  const filteredData = useMemo(() => {
    if (!searchText) return data;
    const lower = searchText.toLowerCase();
    return data.filter(item => 
      item.code?.toLowerCase().includes(lower) || 
      item.name?.toLowerCase().includes(lower)
    );
  }, [searchText, data]);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      // Gộp extraParams (ví dụ: provinceId) vào dữ liệu gửi đi
      const payload = { ...values, ...extraParams };

      if (editingId) {
        // Cắt bỏ query param khi gọi update (chỉ lấy phần tên bảng)
        const pureEndpoint = apiEndpoint.split('?')[0];
        await axios.patch(`http://localhost:3000/master-data/${pureEndpoint}/${editingId}`, values);
        message.success(`Cập nhật thành công!`);
      } else {
        // Cắt bỏ query param khi gọi create
        const pureEndpoint = apiEndpoint.split('?')[0];
        await axios.post(`http://localhost:3000/master-data/${pureEndpoint}`, payload);
        message.success(`Thêm mới thành công!`);
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
      await fetchData();
    } catch (e) { message.error('Lỗi lưu dữ liệu (Có thể trùng Mã)'); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const pureEndpoint = apiEndpoint.split('?')[0];
      await axios.delete(`http://localhost:3000/master-data/${pureEndpoint}/${id}`);
      message.success('Đã xóa');
      await fetchData();
    } catch (e) { message.error('Lỗi khi xóa'); }
    setLoading(false);
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `DanhSach_${title}.xlsx`);
  };

  const handleImport = (file: any) => {
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const jsonData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        message.loading({ content: 'Đang nhập...', key: 'import' });
        
        const pureEndpoint = apiEndpoint.split('?')[0];
        let count = 0;
        
        for (const rawItem of jsonData as any[]) {
          const mappedItem = {
            code: rawItem['Mã'] || rawItem['code'] || rawItem['Mã số'],
            name: rawItem['Tên hiển thị'] || rawItem['Tên'] || rawItem['name'] || rawItem['Tên tuyến'],
            description: rawItem['Mô tả'] || rawItem['description'],
            // Quan trọng: Gộp extraParams vào để import Xã đúng Tỉnh
            ...extraParams 
          };

          if (mappedItem.code && mappedItem.name) {
             try {
               await axios.post(`http://localhost:3000/master-data/${pureEndpoint}`, mappedItem);
               count++;
             } catch {}
          }
        }
        message.success({ content: `Đã nhập ${count} dòng!`, key: 'import' });
        fetchData();
      } catch { message.error('Lỗi file!'); }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const columns = [
    { title: 'STT', width: 50, align: 'center' as const, render: (_:any, __:any, i: number) => i + 1 },
    { 
      title: 'Mã', dataIndex: 'code', key: 'code', width: 120, 
      render: (t:string) => <Tag color={color} style={{fontWeight: 'bold'}}>{t}</Tag> 
    },
    { 
      title: 'Tên hiển thị', dataIndex: 'name', key: 'name', 
      render: (t:string) => <span style={{fontWeight: 500}}>{t}</span> 
    },
    ...(['types', 'statuses', 'routes', 'cargos'].includes(apiEndpoint.split('?')[0]) ? [{ title: 'Mô tả', dataIndex: 'description' }] : []),
    {
      title: 'Thao tác', width: 100, align: 'center' as const,
      render: (_: any, r: any) => (
        <Space>
          <Tooltip title="Sửa"><Button type="text" icon={<EditOutlined style={{ color: 'orange' }} />} onClick={() => { setEditingId(r.id); form.setFieldsValue(r); setIsModalOpen(true); }} /></Tooltip>
          <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id)}>
            <Tooltip title="Xóa"><Button type="text" icon={<DeleteOutlined style={{ color: 'red' }} />} /></Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 20, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Input prefix={<SearchOutlined style={{color:'#999'}}/>} placeholder={`Tìm ${title}...`} value={searchText} onChange={e => setSearchText(e.target.value)} allowClear style={{ borderRadius: 6 }}/>
          </Col>
          <Col xs={24} md={16} style={{ textAlign: 'right' }}>
            <Space>
               <Upload beforeUpload={handleImport} showUploadList={false} accept=".xlsx"><Button icon={<CloudUploadOutlined />}>Import</Button></Upload>
               <Button icon={<FileExcelOutlined />} onClick={handleExport}>Export</Button>
               <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}>Thêm {title}</Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Table columns={columns} dataSource={filteredData} rowKey="id" loading={loading} bordered pagination={{ pageSize: 8 }} size="middle"/>
      
      <Modal title={editingId ? `Cập nhật ${title}` : `Thêm mới ${title}`} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="code" label="Mã" rules={[{ required: true }]}><Input disabled={!!editingId} /></Form.Item>
          <Form.Item name="name" label="Tên hiển thị" rules={[{ required: true }]}><Input /></Form.Item>
          {['types', 'statuses', 'routes', 'cargos'].includes(apiEndpoint.split('?')[0]) && <Form.Item name="description" label="Mô tả"><Input.TextArea /></Form.Item>}
          <div style={{ textAlign: 'right', marginTop: 15 }}>
            <Button onClick={() => setIsModalOpen(false)} style={{marginRight: 8}}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={loading}>{editingId ? 'Lưu' : 'Tạo'}</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default MasterDataPage;