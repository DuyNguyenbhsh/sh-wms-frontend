import { useEffect, useState } from 'react';
import { Table, Button, Card, Typography, Modal, Form, Input, InputNumber, message, Space, Popconfirm, Tag } from 'antd';
import { PlusOutlined, ReloadOutlined, DatabaseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

const ProductsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/products');
      setData(res.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values: any) => {
    try {
      if (editingId) {
        await axios.patch(`http://localhost:3000/products/${editingId}`, values);
        message.success('Cập nhật thành công!');
      } else {
        await axios.post('http://localhost:3000/products', values);
        message.success('Thêm sản phẩm thành công!');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
      fetchData();
    } catch (e) { message.error('Có lỗi xảy ra!'); }
  };

  const handleDelete = async (id: string) => {
    await axios.delete(`http://localhost:3000/products/${id}`);
    message.success('Đã xóa');
    fetchData();
  };

  const columns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 100, render: (t:string) => <b>{t}</b> },
    { title: 'Tên Sản Phẩm', dataIndex: 'name', key: 'name' },
    { 
      title: 'Giá bán (VND)', 
      dataIndex: 'price', 
      key: 'price', 
      render: (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)
    },
    { 
      title: 'Trọng lượng (kg)', 
      dataIndex: 'weight', 
      key: 'weight',
      render: (v: number) => <Tag color="blue">{v} kg</Tag>
    },
    {
      title: '',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Space>
          <Button 
            size="small" icon={<EditOutlined />} 
            onClick={() => { setEditingId(record.id); form.setFieldsValue(record); setIsModalOpen(true); }}
          />
          <Popconfirm title="Xóa?" onConfirm={() => handleDelete(record.id)}>
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card bordered={false}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}><DatabaseOutlined /> Danh mục Hàng Hóa</Title>
        <Space>
           <Button icon={<ReloadOutlined />} onClick={fetchData}>Nạp lại</Button>
           <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}>Thêm Mới</Button>
        </Space>
      </div>
      
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} bordered size="small" />

      <Modal
        title={editingId ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <div style={{ display: 'flex', gap: 10 }}>
            <Form.Item name="sku" label="Mã SKU" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="SP01" />
            </Form.Item>
            <Form.Item name="weight" label="Trọng lượng (kg)" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} step={0.1} placeholder="0.5" />
            </Form.Item>
          </div>
          
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true }]}>
            <Input placeholder="VD: Chuột Logitech..." />
          </Form.Item>

          <Form.Item name="price" label="Giá bán (VND)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Button type="primary" htmlType="submit">Lưu dữ liệu</Button>
          </div>
        </Form>
      </Modal>
    </Card>
  );
};

export default ProductsPage;