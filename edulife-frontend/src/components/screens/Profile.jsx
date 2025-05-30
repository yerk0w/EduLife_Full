import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import './Profile.css';
import avatarImage1 from '../../assets/images/avatar.webp';
import notificationIcon from '../../assets/images/notification.webp';
import settingsIcon from '../../assets/images/settings.webp';
import apiService from '../../services/apiService';

const Profile = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('statistics');
    const [timeRange, setTimeRange] = useState('1 Year');
    const [activeTooltip, setActiveTooltip] = useState(null);
    const chartRef = useRef(null);
    
    // State for user data
    const [userInfo, setUserInfo] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State for edit modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState('');
    const [formData, setFormData] = useState({
      fullName: '',
      birthDate: '',
      gender: '',
      city: '',
      cityId: null,
      collegeId: null,
      college: '',
      email: '',
      phone: '',
      address: '',
      telegram: '',
      group_name: ''

    });

    // State for cities and colleges
    const [cities, setCities] = useState([]);
    const [colleges, setColleges] = useState([]);
    
    // Maximum value for chart
    const maxValue = 100; // Maximum value - 100%
    const timeRangeOptions = ['6 Months', '1 Year', 'All'];
    const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);
    
    // Fetch user data on component mount
    useEffect(() => {
      const fetchUserData = async () => {
        try {
          setLoading(true);
          
          // Get user ID from localStorage
          const userId = localStorage.getItem('userId');
          if (!userId) {
            throw new Error('User not authenticated');
          }
          
          // Fetch cities and colleges
          const citiesResponse = await apiService.auth.getCities();
          setCities(citiesResponse || []);
          
          const collegesResponse = await apiService.auth.getColleges();
          setColleges(collegesResponse || []);
          
          // Fetch user profile
          const userResponse = await apiService.auth.getUserProfile(userId);
          
          if (!userResponse) {
            throw new Error('Failed to get user profile');
          }
          
          setUserInfo(userResponse);
          
          // Initialize form with user data
          setFormData({
            fullName: userResponse.full_name || '',
            email: userResponse.email || '',
            birthDate: userResponse.birth_date || '',
            gender: userResponse.gender || '',
            cityId: userResponse.city_id || null,
            city: userResponse.city_name || '',
            collegeId: userResponse.college_id || null,
            college: userResponse.college_name || '',
            phone: userResponse.phone_number || '',
            address: '', // This field is not in the database yet
            telegram: userResponse.telegram || '',
            group_name: userResponse.group_name || '',
            faculty_name: userResponse.faculty_name || ''
          });

          setAttendanceData([]);
          
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserData();
    }, []);
    
    // Function to handle edit button click
    const handleEditClick = (section) => {
      setEditingSection(section);
      setIsEditModalOpen(true);
    };
    
    // Function to handle city selection changes
    const handleCityChange = async (e) => {
      const cityId = e.target.value ? parseInt(e.target.value) : null;
      
      setFormData({
        ...formData,
        cityId: cityId,
        city: cityId ? cities.find(c => c.id === cityId)?.name || '' : '',
        collegeId: null, // Reset college selection when city changes
        college: ''
      });
      
      // If a city is selected, fetch related colleges
      if (cityId) {
        try {
          const collegesResponse = await apiService.auth.getColleges(cityId);
          setColleges(collegesResponse || []);
        } catch (error) {
          console.error('Error fetching colleges for city:', error);
        }
      }
    };
    
    // Function to handle college selection changes
    const handleCollegeChange = (e) => {
      const collegeId = e.target.value ? parseInt(e.target.value) : null;
      
      setFormData({
        ...formData,
        collegeId: collegeId,
        college: collegeId ? colleges.find(c => c.id === collegeId)?.name || '' : ''
      });
    };
    
    // Function to handle form input changes
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: value
      });
    };
    
    // Function to handle form submission
    const handleFormSubmit = async (e) => {
      e.preventDefault();
      
      try {
        // Get user ID from localStorage
        const userId = localStorage.getItem('userId');
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        // Prepare data for update
        const updateData = {};
        
        if (editingSection === 'personal') {
          // For personal data
          updateData.gender = formData.gender || null;
          updateData.birth_date = formData.birthDate || null;
          updateData.city_id = formData.cityId || null;
          updateData.college_id = formData.collegeId || null;
        } else if (editingSection === 'contact') {
          // For contact data
          updateData.email = formData.email || null;
          updateData.phone_number = formData.phone || null;
          updateData.telegram = formData.telegram || null;
        }
        
        // Send update request
        const updatedProfile = await apiService.auth.updateUserProfile(userId, updateData);
        
        // Update local state with new data
        setUserInfo(updatedProfile);
        
        // Close modal
        setIsEditModalOpen(false);
        
      } catch (err) {
        console.error('Error updating user data:', err);
        alert('Error when updating data: ' + err.message);
      }
    };
    
    const handleTimeRangeClick = () => {
      setShowTimeRangeDropdown(!showTimeRangeDropdown);
    };
    
    const handleTimeRangeSelect = (range) => {
      setTimeRange(range);
      setShowTimeRangeDropdown(false);
    };
    
    // Handlers for tooltips
    const handleBarClick = (index) => {
      if (activeTooltip === index) {
        setActiveTooltip(null);
      } else {
        setActiveTooltip(index);
      }
    };
    
    const handleTabChange = (tab) => {
      setActiveTab(tab);
    };
    
    const handleSettings = () => {
      navigate('/settings');
    };
    
    const handleNotifications = () => {
      navigate('/notifications');
    };
    
    // Calculate total attendance stats
    const calculateTotalAttendance = () => {
      if (!attendanceData || attendanceData.length === 0) {
        return {
          totalPresent: 0,
          totalAbsent: 0,
          attendanceRate: 0
        };
      }
      
      const totalPresent = attendanceData.reduce((sum, month) => sum + (month.presentDays || 0), 0);
      const totalAbsent = attendanceData.reduce((sum, month) => sum + (month.absentDays || 0), 0);
      const totalDays = totalPresent + totalAbsent;
      const attendanceRate = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;
      
      return {
        totalPresent,
        totalAbsent,
        attendanceRate
      };
    };
    
    const totalAttendance = calculateTotalAttendance();
    
    const renderPortfolioTab = () => {
      return (
        <div className="profile-portfolio">
          <div className="user-data-section">
            <h3>Мои данные</h3>
            
            {/* Personal data */}
            <div className="user-data-card">
              <div className="user-data-header">
                <div className="user-data-title">Персональные данные</div>
                <button className="user-data-edit-button" onClick={() => handleEditClick('personal')}>
                  <svg className="user-data-edit-icon" viewBox="0 0 24 24">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  Редактировать
                </button>
              </div>
              
              <div className="personal-data-list">
                <div className="personal-data-item">
                  <div className="personal-data-label">Полное имя</div>
                  <div className="personal-data-value">
                    {userInfo?.full_name || 'Не указано'}
                  </div>
                </div>
                <div className="personal-data-item">
                  <div className="personal-data-label">Дата рождения</div>
                  <div className="personal-data-value">
                    {userInfo?.birth_date || 'Не указано'}
                  </div>
                </div>
                <div className="personal-data-item">
                  <div className="personal-data-label">Пол</div>
                  <div className="personal-data-value">
                    {userInfo?.gender || 'Не указано'}
                  </div>
                </div>
                <div className="personal-data-item">
                  <div className="personal-data-label">Город</div>
                  <div className="personal-data-value">
                    {userInfo?.city_name || 'Не указано'}
                  </div>
                </div>
                <div className="personal-data-item">
                  <div className="personal-data-label">Колледж</div>
                  <div className="personal-data-value">
                    {userInfo?.college_name || 'Не указано'}
                  </div>
                </div>
                <div className="personal-data-item">
                  <div className="personal-data-label">Факультет</div>
                  <div className="personal-data-value">
                    {formData.faculty_name || 'Не указано'}
                  </div>
                </div>
                <div className="personal-data-item">
                  <div className="personal-data-label">Группа</div>
                  <div className="personal-data-value">
                    {formData.group_name || 'Не указано'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact data */}
            <div className="user-data-card">
              <div className="user-data-header">
                <div className="user-data-title">Контактные данные</div>
                <button className="user-data-edit-button" onClick={() => handleEditClick('contact')}>
                  <svg className="user-data-edit-icon" viewBox="0 0 24 24">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  Редактировать
                </button>
              </div>
              
              <div className="contact-data-list">
                <div className="contact-data-item">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                  </div>
                  <div className="contact-info">
                    <div className="contact-type">Email</div>
                    <div className="contact-value verified">
                      {userInfo?.email || 'Не указано'}
                      <span className="verified-badge">Подтвержден</span>
                    </div>
                  </div>
                </div>
                
                <div className="contact-data-item">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                  </div>
                  <div className="contact-info">
                    <div className="contact-type">Телефон</div>
                    <div className="contact-value">
                      {userInfo?.phone_number || 'Не указано'}
                    </div>
                  </div>
                </div>
                
                <div className="contact-data-item">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                  <div className="contact-info">
                    <div className="contact-type">Адрес</div>
                    <div className="contact-value">
                      {formData.address || 'Не указано'}
                    </div>
                  </div>
                </div>
                
                <div className="contact-data-item">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <div className="contact-info">
                    <div className="contact-type">Telegram</div>
                    <div className="contact-value">
                      {userInfo?.telegram || 'Не указано'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };
    
    const renderStatisticsTab = () => {
      return (
        <div className="profile-statistics">
          
          {/* Document Flow Button */}
          <div className="document-flow-container">
            <button className="document-flow-button" onClick={() => navigate('/documents')}>
              <div className="document-flow-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span>Документооборот</span>
            </button>
          </div>
          
          {/* Analytics card */}
          <div className="analytics-card">
            <div className="analytics-header">
              <h3>Аналитика посещаемости</h3>
              <div className="time-range-selector" onClick={handleTimeRangeClick}>
                <span>{timeRange}</span>
                <span className="dropdown-icon">▼</span>
                
                {showTimeRangeDropdown && (
                  <div className="time-range-dropdown">
                    {timeRangeOptions.map(range => (
                      <div 
                        key={range} 
                        className={`dropdown-item ${timeRange === range ? 'active' : ''}`}
                        onClick={() => handleTimeRangeSelect(range)}
                      >
                        {range}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {attendanceData.length > 0 ? (
              <div className="chart-container" ref={chartRef}>
                {attendanceData.map((item, index) => (
                  <div key={index} className="chart-column">
                    <div 
                      className="chart-bar-container"
                      onClick={() => handleBarClick(index)}
                    >
                      <div 
                        className={`chart-bar ${item.isVacation ? 'vacation' : ''}`}
                        style={{ height: `${(item.value / maxValue) * 100}%` }}
                      >
                        <div className="chart-bar-handle"></div>
                      </div>
                    </div>
                    <div className={`chart-label ${item.isVacation ? 'vacation' : ''}`}>
                      {item.month}
                    </div>
                    
                    {activeTooltip === index && (
                      <div className="chart-tooltip">
                        <div className="tooltip-content">
                          <div className="tooltip-title">{item.month} {item.year}</div>
                          {!item.isVacation ? (
                            <>
                              <div className="tooltip-attendance">
                                <div className="tooltip-present">
                                  <span>Присутствовал:</span>
                                  <span>{item.presentDays} дней</span>
                                </div>
                                <div className="tooltip-absent">
                                  <span>Отсутствовал:</span>
                                  <span>{item.absentDays} дней</span>
                                </div>
                              </div>
                              <div className="tooltip-rate">
                                Посещаемость: {item.value}%
                              </div>
                            </>
                          ) : (
                            <div className="tooltip-vacation">
                              <span>Каникулы</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <p>Данные о посещаемости отсутствуют</p>
              </div>
            )}
            
            <div className="attendance-summary">
              <div className="attendance-days">
                <span className="days-present">Присутствовал: {totalAttendance.totalPresent} дней</span>
                <span className="days-absent">Отсутствовал: {totalAttendance.totalAbsent} дней</span>
              </div>
              <div className="attendance-rate">
                <span className="rate-label">Посещаемость:</span>
                <span className="rate-value">{totalAttendance.attendanceRate}%</span>
              </div>
            </div>
          </div>
        </div>
      );
    };
    
    const renderReviewsTab = () => {
      return (
        <div className="profile-reviews">
          <h3>Посещаемость</h3>
          <div className="attendance-info">
            <div className="attendance-stat">
              <div className="attendance-value">{totalAttendance.totalPresent}/{totalAttendance.totalPresent + totalAttendance.totalAbsent}</div>
              <div className="attendance-label">Дней в этом году</div>
            </div>
            <div className="attendance-stat">
              <div className="attendance-value">{totalAttendance.attendanceRate}%</div>
              <div className="attendance-label">Посещаемость</div>
            </div>
          </div>
        </div>
      );
    };
    
    const renderTabContent = () => {
      switch(activeTab) {
        case 'statistics':
          return renderStatisticsTab();
        case 'portfolio':
          return renderPortfolioTab();
        case 'reviews':
          return renderReviewsTab();
        default:
          return null;
      }
    };
    
    if (loading) {
      return (
        <div className="profile-screen">
          <div className="loading-message">
          <div class="loader">
            <div class="loader__bar"></div>
            <div class="loader__bar"></div>
            <div class="loader__bar"></div>
            <div class="loader__bar"></div>
            <div class="loader__bar"></div>
            <div class="loader__ball"></div>
          </div>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="profile-screen">
          <div className="error-message">Ошибка: {error}</div>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Повторить попытку
          </button>
        </div>
      );
    }
    
    return (
      <div className="profile-screen">
        <div className="profile-header">
          <button className="header-icon-button" onClick={handleSettings}>
            <img src={settingsIcon} alt="Settings" />
          </button>
          <h1>Мой профиль</h1>
          <button className="header-icon-button" onClick={handleNotifications}>
            <img src={notificationIcon} alt="Notifications" />
            <div className="notification-badge">2</div>
          </button>
        </div>
        
        <div className="profile-user-info">
          <div className="avatar1-container">
            <img src={avatarImage1} alt="User avatar" className="avatar1-image" />
            <div className="avatar-border"></div>
          </div>
          <h2 className="user-name">{userInfo?.full_name || 'Пользователь'}</h2>
          {userInfo?.role_name && (
            <p className="user-role">{userInfo.role_name === 'admin' ? 'Администратор' : 
                                      userInfo.role_name === 'teacher' ? 'Преподаватель' : 
                                      'Студент'}</p>
          )}
        </div>
        
        <div className="profile-tabs">
          <button 
            className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => handleTabChange('statistics')}
          >
            Статистика
          </button>
          <button 
            className={`tab-button ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => handleTabChange('portfolio')}
          >
            Мои данные
          </button>
          <button 
            className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => handleTabChange('reviews')}
          >
            Обзор
          </button>
        </div>
        
        <div className="profile-content">
          {renderTabContent()}
        </div>
        
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="edit-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
              <div className="edit-modal-header">
                <div className="edit-modal-title">
                  {editingSection === 'personal' ? 'Редактировать персональные данные' : 'Редактировать контактные данные'}
                </div>
                <button className="edit-modal-close" onClick={() => setIsEditModalOpen(false)}>×</button>
              </div>
              
              <form className="edit-form" onSubmit={handleFormSubmit}>
                {editingSection === 'personal' ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Полное имя</label>
                      <input 
                        className="form-input" 
                        type="text" 
                        name="fullName" 
                        value={formData.fullName} 
                        onChange={handleInputChange} 
                        disabled={true} // Name can only be changed during registration
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Дата рождения</label>
                      <input 
                        className="form-input" 
                        type="date" 
                        name="birthDate" 
                        value={formData.birthDate} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Пол</label>
                      <select 
                        className="form-select" 
                        name="gender" 
                        value={formData.gender} 
                        onChange={handleInputChange}
                      >
                        <option value="">-- Выберите --</option>
                        <option value="Мужской">Мужской</option>
                        <option value="Женский">Женский</option>
                        <option value="Другой">Другой</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Город</label>
                      <select
                        className="form-select"
                        name="cityId"
                        value={formData.cityId || ''}
                        onChange={handleCityChange}
                      >
                        <option value="">-- Выберите город --</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Колледж</label>
                      <select
                        className="form-select"
                        name="collegeId"
                        value={formData.collegeId || ''}
                        onChange={handleCollegeChange}
                        disabled={!formData.cityId}
                      >
                        <option value="">-- Выберите колледж --</option>
                        {colleges.map(college => (
                          <option key={college.id} value={college.id}>{college.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input 
                        className="form-input" 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                        disabled={true} // Email can only be changed during registration
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Телефон</label>
                      <input 
                        className="form-input" 
                        type="tel" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleInputChange} 
                        placeholder="+7 (999) 123-45-67"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Адрес</label>
                      <input 
                        className="form-input" 
                        type="text" 
                        name="address" 
                        value={formData.address} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Telegram</label>
                      <input 
                        className="form-input" 
                        type="text" 
                        name="telegram" 
                        value={formData.telegram} 
                        onChange={handleInputChange} 
                        placeholder="@username"
                      />
                    </div>
                  </>
                )}
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="form-button cancel" 
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Отмена
                  </button>
                  <button type="submit" className="form-button save">
                    Сохранить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
};

export default Profile;