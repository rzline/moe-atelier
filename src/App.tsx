import * as React from 'react';
import { useState, useCallback } from 'react';
import { Layout, Button, Form, Input, Switch, Row, Col, Typography, Space, ConfigProvider, Drawer, AutoComplete, message, Tooltip } from 'antd';
import { 
  PlusOutlined, 
  SettingFilled, 
  ThunderboltFilled, 
  CheckCircleFilled, 
  ApiFilled, 
  HeartFilled,
  AppstoreFilled,
  ExperimentFilled,
  SafetyCertificateFilled,
  ReloadOutlined
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import ImageTask from './components/ImageTask';
import type { AppConfig, TaskConfig } from './types/app';
import type { GlobalStats } from './types/stats';
import {
  cleanupTaskCache,
  getTaskStorageKey,
  loadConfig,
  loadGlobalStats,
  loadTasks,
  STORAGE_KEYS,
} from './app/storage';
import { safeStorageSet } from './utils/storage';
import { calculateSuccessRate, formatDuration } from './utils/stats';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function App() {
  const [config, setConfig] = useState<AppConfig>(() => loadConfig());
  const [tasks, setTasks] = useState<TaskConfig[]>(() => loadTasks());
  const [globalStats, setGlobalStats] = useState<GlobalStats>(() => loadGlobalStats());
  const [configVisible, setConfigVisible] = useState(false);
  const [models, setModels] = useState<{label: string, value: string}[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return;
    navigator.storage.persist().catch(() => undefined);
  }, []);

  React.useEffect(() => {
    safeStorageSet(STORAGE_KEYS.config, JSON.stringify(config), 'app cache');
  }, [config]);

  React.useEffect(() => {
    safeStorageSet(
      STORAGE_KEYS.tasks,
      JSON.stringify(tasks.map((task: TaskConfig) => task.id)),
      'app cache',
    );
  }, [tasks]);

  React.useEffect(() => {
    safeStorageSet(
      STORAGE_KEYS.globalStats,
      JSON.stringify(globalStats),
      'app cache',
    );
  }, [globalStats]);

  const fetchModels = async () => {
    const currentConfig = form.getFieldsValue();
    if (!currentConfig.apiKey) {
      message.warning('请先填写 API 密钥');
      return;
    }
    if (!currentConfig.apiUrl) {
      message.warning('请先填写 API 地址');
      return;
    }

    setLoadingModels(true);
    try {
      // 移除末尾斜杠
      const baseUrl = currentConfig.apiUrl.replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${currentConfig.apiKey}`
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        const modelOptions = data.data
          .map((m: any) => ({ label: m.id, value: m.id }))
          .sort((a: any, b: any) => a.value.localeCompare(b.value));
        setModels(modelOptions);
        message.success(`成功获取 ${modelOptions.length} 个模型`);
      } else {
        throw new Error('返回数据格式不正确');
      }
    } catch (e) {
      console.error(e);
      message.error('获取模型列表失败，请检查配置');
    } finally {
      setLoadingModels(false);
    }
  };

  // 当配置抽屉打开且有 API Key 时，如果列表为空，自动获取一次
  React.useEffect(() => {
    if (configVisible && config.apiKey && models.length === 0) {
      fetchModels();
    }
  }, [configVisible]);

  const handleAddTask = () => {
    setTasks([...tasks, { id: uuidv4(), prompt: '' }]);
  };

  const handleRemoveTask = (id: string) => {
    void cleanupTaskCache(getTaskStorageKey(id));
    setTasks(tasks.filter((t: TaskConfig) => t.id !== id));
  };

  const handleConfigChange = (_changedValues: any, allValues: AppConfig) => {
    setConfig({ ...config, ...allValues });
  };

  const updateGlobalStats = useCallback((type: 'request' | 'success' | 'fail', duration?: number) => {
    setGlobalStats((prev: GlobalStats) => {
      const newState = {
        ...prev,
        totalRequests: type === 'request' ? prev.totalRequests + 1 : prev.totalRequests,
        successCount: type === 'success' ? prev.successCount + 1 : prev.successCount,
      };

      if (type === 'success' && duration) {
        newState.totalTime = prev.totalTime + duration;
        newState.fastestTime = prev.fastestTime === 0 ? duration : Math.min(prev.fastestTime, duration);
        newState.slowestTime = Math.max(prev.slowestTime, duration);
      }

      return newState;
    });
  }, []);

  const successRate = calculateSuccessRate(
    globalStats.totalRequests,
    globalStats.successCount,
  );
  
  const averageTime = globalStats.successCount > 0 
    ? formatDuration(globalStats.totalTime / globalStats.successCount)
    : '0.0s';
  
  const fastestTimeStr = formatDuration(globalStats.fastestTime);

  const slowestTimeStr = formatDuration(globalStats.slowestTime);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FF9EB5',
          colorTextBase: '#665555',
          colorBgBase: '#FFF9FA',
          borderRadius: 20,
          fontFamily: "'Nunito', 'Quicksand', sans-serif",
        },
        components: {
          Button: {
            colorPrimary: '#FF9EB5',
            algorithm: true,
            fontWeight: 700,
          },
          Input: {
            colorBgContainer: '#FFF0F3',
            activeBorderColor: '#FF9EB5',
            hoverBorderColor: '#FFB7C5',
          },
          Drawer: {
            colorBgElevated: '#FFFFFF',
          }
        }
      }}
    >
      <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
        {/* 顶部导航栏 */}
        <Header style={{ 
          height: 72, 
          padding: '0 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 4px 20px rgba(255, 158, 181, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="hover-scale" style={{ 
              width: 40, 
              height: 40, 
              background: 'linear-gradient(135deg, #FF9EB5 0%, #FF7090 100%)', 
              borderRadius: 14, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255, 158, 181, 0.4)',
              transform: 'rotate(-6deg)',
            }}>
              <HeartFilled style={{ fontSize: 20, color: '#fff' }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: '#665555', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1 }}>
                萌图 <span style={{ color: '#FF9EB5' }}>工坊</span>
              </Title>
            </div>
          </div>

          <Space size={12}>
            <Button 
              icon={<SettingFilled />} 
              onClick={() => setConfigVisible(true)}
              size="large"
              className="mobile-hidden"
            >
              系统配置
            </Button>
            <Button 
              icon={<SettingFilled />} 
              onClick={() => setConfigVisible(true)}
              size="large"
              shape="circle"
              className="desktop-hidden"
            />
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAddTask}
              size="large"
            >
              新建任务
            </Button>
          </Space>
        </Header>
        
        <Content style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          
          {/* 数据仪表盘 - 重新设计 */}
          <div className="fade-in-up" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingLeft: 4 }}>
              <AppstoreFilled style={{ fontSize: 18, color: '#FF9EB5' }} />
              <Text style={{ fontSize: 18, fontWeight: 800, color: '#665555' }}>
                数据总览
              </Text>
            </div>
            
            <div className="stat-panel">
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={8} lg={4}>
                  <div className="stat-item">
                    <div style={{ 
                      width: 40, height: 40, borderRadius: '50%', background: '#E0F7FA', color: '#00BCD4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 8
                    }}>
                      <ThunderboltFilled />
                    </div>
                    <div className="stat-value">{globalStats.totalRequests}</div>
                    <div className="stat-label">总请求数</div>
                  </div>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                  <div className="stat-item">
                    <div style={{ 
                      width: 40, height: 40, borderRadius: '50%', background: '#E8F5E9', color: '#4CAF50',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 8
                    }}>
                      <CheckCircleFilled />
                    </div>
                    <div className="stat-value" style={{ color: '#4CAF50' }}>{globalStats.successCount}</div>
                    <div className="stat-label">成功生成</div>
                  </div>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                  <div className="stat-item">
                    <div style={{ 
                      width: 40, height: 40, borderRadius: '50%', background: '#FFF8E1', color: '#FFC107',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 8
                    }}>
                      <ExperimentFilled />
                    </div>
                    <div className="stat-value" style={{ color: successRate > 80 ? '#4CAF50' : '#FFC107' }}>
                      {successRate}%
                    </div>
                    <div className="stat-label">成功率</div>
                  </div>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                  <div className="stat-item">
                    <div style={{ 
                      width: 40, height: 40, borderRadius: '50%', background: '#E3F2FD', color: '#2196F3',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 8
                    }}>
                      <ThunderboltFilled />
                    </div>
                    <div className="stat-value" style={{ color: '#2196F3' }}>{fastestTimeStr}</div>
                    <div className="stat-label">最快用时</div>
                  </div>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                  <div className="stat-item">
                    <div style={{ 
                      width: 40, height: 40, borderRadius: '50%', background: '#FFEBEE', color: '#FF5252',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 8
                    }}>
                      <ThunderboltFilled />
                    </div>
                    <div className="stat-value" style={{ color: '#FF5252' }}>{slowestTimeStr}</div>
                    <div className="stat-label">最慢用时</div>
                  </div>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                  <div className="stat-item">
                    <div style={{ 
                      width: 40, height: 40, borderRadius: '50%', background: '#F3E5F5', color: '#9C27B0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 8
                    }}>
                      <ReloadOutlined />
                    </div>
                    <div className="stat-value" style={{ color: '#9C27B0' }}>{averageTime}</div>
                    <div className="stat-label">平均用时</div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>

          {/* 任务列表 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingLeft: 4 }}>
            <div style={{ 
              width: 24, height: 24, borderRadius: '50%', background: '#FF9EB5', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              fontSize: 12, fontWeight: 700
            }}>
              {tasks.length}
            </div>
            <Text style={{ fontSize: 18, fontWeight: 800, color: '#665555' }}>
              进行中的任务
            </Text>
          </div>

          <Row gutter={[24, 24]}>
            {tasks.map((task: TaskConfig) => (
              <Col xs={24} sm={12} xl={8} key={task.id} className="fade-in-up">
                <ImageTask
                  id={task.id}
                  storageKey={getTaskStorageKey(task.id)}
                  config={config}
                  onRemove={() => handleRemoveTask(task.id)}
                  onStatsUpdate={updateGlobalStats}
                />
              </Col>
            ))}
          </Row>
        </Content>

        {/* 配置抽屉 */}
        <Drawer
          title={
            <Space>
              <div style={{ 
                width: 32, height: 32, borderRadius: 10, background: '#FFF0F3', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF9EB5' 
              }}>
                <SettingFilled />
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#665555' }}>系统配置</span>
            </Space>
          }
          placement="right"
          onClose={() => setConfigVisible(false)}
          open={configVisible}
          width={400}
          styles={{ body: { padding: 24 } }}
        >
          <Form
            layout="vertical"
            initialValues={config}
            onValuesChange={handleConfigChange}
            form={form}
          >
            <Form.Item name="apiUrl" label={<span style={{ fontWeight: 700, color: '#665555' }}>API 接口地址</span>}>
              <Input size="large" placeholder="https://api.openai.com/v1" prefix={<ApiFilled style={{ color: '#D0C0C0' }} />} />
            </Form.Item>
            
            <Form.Item name="apiKey" label={<span style={{ fontWeight: 700, color: '#665555' }}>API 密钥</span>}>
              <Input.Password size="large" placeholder="sk-..." prefix={<SafetyCertificateFilled style={{ color: '#D0C0C0' }} />} />
            </Form.Item>
            
            <Form.Item label={<span style={{ fontWeight: 700, color: '#665555' }}>模型名称</span>}>
              <Row gutter={8}>
                <Col flex="auto">
                  <Form.Item name="model" noStyle>
                    <AutoComplete
                      options={models}
                      filterOption={(inputValue, option) =>
                        option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                      }
                      dropdownMatchSelectWidth={false}
                      dropdownStyle={{ minWidth: 300 }}
                    >
                      <Input 
                        size="large" 
                        placeholder="请输入模型名称"
                        prefix={<ExperimentFilled style={{ color: '#D0C0C0' }} />} 
                      />
                    </AutoComplete>
                  </Form.Item>
                </Col>
                <Col flex="none">
                  <Tooltip title="获取模型列表">
                    <Button 
                      icon={<ReloadOutlined spin={loadingModels} />} 
                      onClick={fetchModels}
                      size="large"
                    />
                  </Tooltip>
                </Col>
              </Row>
            </Form.Item>
            
            <div style={{ background: '#F8F9FA', padding: '16px', borderRadius: 16, marginBottom: 24, border: '1px solid #eee' }}>
              <Form.Item 
                name="stream" 
                label={<span style={{ fontWeight: 700, color: '#665555' }}>流式传输</span>}
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>启用实时生成进度更新</Text>
                  <Switch />
                </div>
              </Form.Item>
            </div>

            <div style={{ marginTop: 24, padding: 16, background: '#FFF8E1', borderRadius: 16, border: '1px dashed #FFC107' }}>
              <Space align="start">
                <ThunderboltFilled style={{ color: '#FFC107', marginTop: 4, fontSize: 16 }} />
                <Text type="secondary" style={{ fontSize: 13, color: '#8D6E63', lineHeight: 1.5 }}>
                  设置将自动应用于所有活动任务窗口。请确保您的 API 密钥有足够的配额。
                </Text>
              </Space>
            </div>
          </Form>
        </Drawer>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
