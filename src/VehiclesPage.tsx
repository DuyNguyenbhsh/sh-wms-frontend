import { useEffect, useState } from 'react';
import { 
  Table, Button, Card, Modal, Form, Input, Select, 
  message, Tag, Space, Popconfirm, Tooltip, Row, Col, Upload 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, CarOutlined, 
  ReloadOutlined, SearchOutlined, CloudUploadOutlined, FileExcelOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import * as XLSX from 'xlsx'; // Nhớ cài: npm install xlsx

const VehiclesPage = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  // 1. Tải dữ liệu
  const fetchData = async () => {
    setLoading(true);
    try {
      // Giả sử API là /vehicles. Nếu anh đặt tên khác trong Controller thì sửa lại nhé
      const res = await axios.get('http://localhost:3000/vehicles'); 
      setData(res.data);
    } catch (error) {
      // Nếu chưa có API thật, dùng data giả để test giao diện
      // setData([
      //   { id: '1', code: 'XE001', plateNumber: '59H1-04901', driverName: 'Nguyễn Trí Duy Tài xế', brand: 'Sirius', status: 'ACTIVE' }
      // ]);
      console.log('Chưa kết nối được API Vehicles');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // 2. Xử lý Lưu (Thêm/Sửa)
  const handleSave = async (values: any) => {
    try {
      if (editingId) {
        await axios.patch(`http://localhost:3000/vehicles/${editingId}`, values);
        message.success('Cập nhật thành công!');
      } else {
        await axios.post('http://localhost:3000/vehicles', values);
        message.success('Thêm xe mới thành công!');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
      fetchData();
    } catch (error) {
      message.error('Lỗi lưu dữ liệu');
    }
  };

  // 3. Xử lý Xóa
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3000/vehicles/${id}`);
      message.success('Đã xóa xe');
      fetchData();
    } catch (error) {
      message.error('Lỗi khi xóa');
    }
  };

  // --- TÍNH NĂNG MỚI: EXPORT EXCEL ---
  const handleExport = () => {
    // Map dữ liệu sang tiếng Việt cho đẹp
    const exportData = data.map((item, index) => ({
      'STT': index + 1,
      'Mã xe': item.code,
      'Biển số': item.plateNumber,
      'Tên tài xế': item.driverName,
      'Hãng xe': item.brand,
      'Tải trọng (kg)': item.capacity || 0,
      'Trạng thái': item.status
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DanhSachXe");
    XLSX.writeFile(wb, "Danh_Sach_Phuong_Tien.xlsx");
  };

  // --- TÍNH NĂNG MỚI: IMPORT EXCEL ---
  const handleImport = (file: any) => {
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const jsonData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        
        message.loading({ content: 'Đang nhập dữ liệu...', key: 'import' });
        let count = 0;

        for (const rawItem of jsonData as any[]) {
          // Map cột Tiếng Việt (Excel) -> Tiếng Anh (Code)
          const mappedItem = {
            code: rawItem['Mã xe'] || rawItem['Mã'] || rawItem['code'],
            plateNumber: rawItem['Biển số'] || rawItem['Biển kiểm soát'] || rawItem['plateNumber'],
            driverName: rawItem['Tên tài xế'] || rawItem['Tài xế'] || rawItem['driverName'],
            brand: rawItem['Hãng xe'] || rawItem['Loại xe'] || rawItem['brand'],
            capacity: rawItem['Tải trọng'] || rawItem['Tải trọng (kg)'] || 0,
            status: 'ACTIVE' // Mặc định là Hoạt động
          };

          // Chỉ thêm nếu có Biển số và Tài xế
          if (mappedItem.plateNumber && mappedItem.driverName) {
            try {
              await axios.post('http://localhost:3000/vehicles', mappedItem);
              count++;
            } catch (err) { console.error('Lỗi dòng:', mappedItem); }
          }
        }

        if (count > 0) {
          message.success({ content: `Đã nhập thành công ${count} xe!`, key: 'import' });
          fetchData();
        } else {
          message.warning({ content: 'Không tìm thấy dữ liệu hợp lệ (Cần cột: Biển số, Tên tài xế)', key: 'import' });
        }
      } catch (error) {
        message.error({ content: 'Lỗi đọc file Excel', key: 'import' });
      }
    };
    reader.readAsArrayBuffer(file);
    return false; // Chặn upload mặc định của Antd
  };

  const columns = [
    { title: 'Mã số', dataIndex: 'code', key: 'code', render: (t:string) => <b>{t}</b> },
    { title: 'Biển số', dataIndex: 'plateNumber', key: 'plateNumber', render: (t:string) => <Tag color="blue">{t}</Tag> },
    { title: 'Tên xe / Tài xế', dataIndex: 'driverName', key: 'driverName' },
    { title: 'Hãng xe', dataIndex: 'brand', key: 'brand' },
    { 
      title: 'Tình trạng', dataIndex: 'status', key: 'status',
      render: (status: string) => (
        status === 'ACTIVE' ? <Tag color="success">Hoạt động</Tag> : <Tag color="default">Bảo trì/Nghỉ</Tag>
      )
    },
    {
      title: 'Hành động', key: 'action', align: 'center' as const,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Sửa"><Button icon={<EditOutlined style={{color: 'blue'}}/>} size="small" onClick={() => { setEditingId(record.id); form.setFieldsValue(record); setIsModalOpen(true); }} /></Tooltip>
          <Popconfirm title="Xóa xe này?" onConfirm={() => handleDelete(record.id)}>
             <Tooltip title="Xóa"><Button icon={<DeleteOutlined style={{color: 'red'}}/>} size="small" danger /></Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 20 }}>
      <Card 
        title={<span><CarOutlined /> Danh mục Phương tiện</span>} 
        bordered={false} 
        style={{ borderRadius: 8 }}
      >
        {/* THANH CÔNG CỤ */}
        <Row justify="space-between" style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Input 
              placeholder="Tìm theo biển số, tài xế..." 
              prefix={<SearchOutlined style={{color:'#ccc'}}/>} 
              onChange={e => setSearchText(e.target.value)}
            />
          </Col>
          <Col>
            <Space>
               <Button icon={<ReloadOutlined />} onClick={fetchData}>Nạp lại</Button>
               
               {/* NÚT IMPORT */}
               <Upload beforeUpload={handleImport} showUploadList={false} accept=".xlsx, .xls">
                  <Button icon={<CloudUploadOutlined />}>Import</Button>
               </Upload>

               {/* NÚT EXPORT */}
               <Button icon={<FileExcelOutlined />} onClick={handleExport}>Export</Button>

               <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}>
                 Thêm Mới
               </Button>
            </Space>
          </Col>
        </Row>

        <Table 
          columns={columns} 
          dataSource={data.filter(item => 
            item.plateNumber?.toLowerCase().includes(searchText.toLowerCase()) || 
            item.driverName?.toLowerCase().includes(searchText.toLowerCase())
          )} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* MODAL THÊM / SỬA */}
      <Modal 
        title={editingId ? "Cập nhật thông tin Xe" : "Thêm Xe Mới"} 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="code" label="Mã xe (Tùy chọn)"><Input placeholder="VD: XE001" /></Form.Item>
          <Form.Item name="plateNumber" label="Biển số" rules={[{ required: true }]}><Input placeholder="VD: 59H1-123.45" /></Form.Item>
          <Form.Item name="driverName" label="Tên Tài xế / Tên xe" rules={[{ required: true }]}><Input placeholder="VD: Nguyễn Văn A" /></Form.Item>
          <Row gutter={16}>
             <Col span={12}><Form.Item name="brand" label="Hãng xe"><Input placeholder="VD: Hyundai, Honda" /></Form.Item></Col>
             <Col span={12}><Form.Item name="capacity" label="Tải trọng (kg)"><Input type="number" /></Form.Item></Col>
          </Row>
          <Form.Item name="status" label="Trạng thái" initialValue="ACTIVE">
            <Select>
              <Select.Option value="ACTIVE">Hoạt động</Select.Option>
              <Select.Option value="MAINTENANCE">Đang bảo trì</Select.Option>
              <Select.Option value="BUSY">Đang bận</Select.Option>
            </Select>
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: 10 }}>
            <Button onClick={() => setIsModalOpen(false)} style={{marginRight: 8}}>Hủy</Button>
            <Button type="primary" htmlType="submit">Lưu lại</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default VehiclesPage;