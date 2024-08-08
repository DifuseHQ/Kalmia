import React, { useContext, useEffect, useRef, useState } from 'react';
import AceEditor from 'react-ace';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';

import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';

import {
  createDocumentation,
  getDocumentation,
  updateDocumentation
} from '../../api/Requests';
import { ModalContext } from '../../context/ModalContext';
import { ThemeContext } from '../../context/ThemeContext';
import {
  handleError,
  landingPagevalidate,
  prepareLandingPageData,
  validateCommunityFields,
  validateFormData,
  useOutsideAlerter
} from '../../utils/Common';
import { toastMessage } from '../../utils/Toast';
import { customCSSInitial, SocialLinkIcon } from '../../utils/Utils';
import Breadcrumb from '../Breadcrumb/Breadcrumb';

const LabelAndCommunityComponent = ({
  index,
  labelId,
  linkId,
  data,
  onLabelChange,
  onLinkChange
}) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid gap-4 grid-cols-2 my-2"
      key={`footer-more-field-${index}`}
    >
      <div>
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('label')}
          <span className='text-red-500 ml-1'>*</span>
        </span>
        <input
          type="text"
          id={labelId}
          value={data?.label || ''}
          name={index}
          onChange={(e) => onLabelChange(index, e.target.value)}
          placeholder={t('label_placeholder')}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
        />
      </div>
      <div>
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('link')}
          <span className='text-red-500 ml-1'>*</span>
        </span>
        <input
          type="text"
          value={data?.link || ''}
          id={linkId}
          name={index}
          onChange={(e) => onLinkChange(index, e.target.value)}
          placeholder={t('more_footer_link_placeholder')}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
        />
      </div>
    </motion.div>
  );
};

export default function CreateDocModal () {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParam] = useSearchParams();
  const docId = searchParam.get('id');
  const mode = searchParam.get('mode');
  const { openModal, closeModal, setLoadingMessage } = useContext(ModalContext);
  const { darkMode } = useContext(ThemeContext);
  const [isToggleOn, SetIsToggleOn] = useState(false);
  const [activeFieldIndex, setActiveFieldIndex] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRefs = useRef([]);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '',
    baseURL: '',
    url: '',
    organizationName: '',
    projectName: '',
    customCSS: customCSSInitial(),
    favicon: '',
    navImage: '',
    copyrightText: '',
    metaImage: ''
  });

  const [moreField, setMoreField] = useState([{ label: '', link: '' }]);
  const [socialPlatformField, setSocialPlatformField] = useState([
    { icon: '', link: '' }
  ]);
  
  const [landingPage, setLandingPage] = useState({
    ctaButtonText: {
      ctaButtonLinkLabel: '',
      ctaButtonLink: ''
    },
    secondCtaButtonText: {
      ctaButtonLinkLabel: '',
      ctaButtonLink: ''
    },
    ctaImageLink: '',
    features: [{ emoji: '', title: '', text: '' }]
  });

  const pickerRef = useRef(null);
  useOutsideAlerter(pickerRef, () => setShowEmojiPicker(false));


  useEffect(() => {
    if (isToggleOn) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [isToggleOn]);

  useEffect(() => {
    if (mode === 'edit') {
      const fetchDoc = async () => {
        const result = await getDocumentation(Number(docId));
        if (result.status === 'success') {
          const landingPageDetails = JSON.parse(result.data.landerDetails);
          const validateLandingDetails = prepareLandingPageData(landingPageDetails)
          if (Object.keys(validateLandingDetails).length !== 0) {
            SetIsToggleOn(true);
          }
          setFormData(result?.data);
          const footerLabelLinks = result?.data?.footerLabelLinks;
          setSocialPlatformField(
            footerLabelLinks
              ? JSON.parse(footerLabelLinks)
              : [{ icon: '', link: '' }]
          );
          const moreLabelLinks = result?.data?.moreLabelLinks;
          setMoreField(
            moreLabelLinks
              ? JSON.parse(moreLabelLinks)
              : [{ label: '', link: '' }]
          );
          setLandingPage({
            ctaButtonText: {
              ctaButtonLinkLabel: landingPageDetails.ctaButtonText.ctaButtonLinkLabel,
              ctaButtonLink: landingPageDetails.ctaButtonText.ctaButtonLink
            },
            secondCtaButtonText: {
              ctaButtonLinkLabel: landingPageDetails.secondCtaButtonText.ctaButtonLinkLabel,
              ctaButtonLink: landingPageDetails.secondCtaButtonText.ctaButtonLink
            },
            ctaImageLink: landingPageDetails.ctaImageLink,
            features: landingPageDetails.features.map(feature => ({
              emoji: feature.emoji,
              title: feature.title,
              text: feature.text
            }))
          });
        } else {
          handleError(result, navigate, t);
        }
      };
      fetchDoc();
    } else {
      SetIsToggleOn(false)
      setFormData({
        name: '',
        description: '',
        version: '',
        baseURL: '',
        url: '',
        organizationName: '',
        projectName: '',
        customCSS: customCSSInitial(),
        favicon: '',
        navImage: '',
        copyrightText: '',
        metaImage: ''
      });
      setSocialPlatformField([{ icon: '', link: '' }]);
      setMoreField([{ label: '', link: '' }]);
      setLandingPage({
        ctaButtonText: {
          ctaButtonLinkLabel: '',
          ctaButtonLink: ''
        },
        secondCtaButtonText: {
          ctaButtonLinkLabel: '',
          ctaButtonLink: ''
        },
        ctaImageLink: '',
        features: [{ emoji: '', title: '', text: '' }]
      });
    }
  }, [docId, mode, navigate]); //eslint-disable-line

  const addRow = (fieldType) => {
    if (fieldType === 'social-platform-field') {
      setSocialPlatformField([...socialPlatformField, { icon: '', link: '' }]);
    } else if (fieldType === 'more') {
      setMoreField([...moreField, { label: '', link: '' }]);
    } else if (fieldType === 'feature-filed') {
      setLandingPage((prevState) => ({
        ...prevState,
        features: [...prevState.features, { emoji: '', title: '', text: '' }]
      }));
    }
  };

  const deleteRow = (fieldType) => {
    if (fieldType === 'social-platform-field') {
      if (socialPlatformField.length > 1) {
        setSocialPlatformField(socialPlatformField.slice(0, -1));
      } else {
        setSocialPlatformField([{ icon: '', link: '' }]);
      }
    } else if (fieldType === 'more') {
      if (moreField.length > 1) {
        setMoreField(moreField.slice(0, -1));
      }else {
        setMoreField([{ label: '', link: '' }]);
      }
    } else if (fieldType === 'feature-filed') {
      if (landingPage.features.length > 1) {
        setLandingPage((prevState) => ({
          ...prevState,
          features: prevState.features.slice(0, -1)
        }));
      } else {
        setLandingPage(() => ({
          features: [{ emoji: '', title: '', text: '' }]
        }));
      }
    }
  };

  const titleRef = useRef(null);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value || ''
    });
  };

  const handleCreateDocument = async () => {
    const validate = validateFormData(formData);
    if (validate.status) {
      toastMessage(t(validate.message), 'error');
      return;
    }

    const validateCommunity = validateCommunityFields(
      socialPlatformField,
      moreField
    );

    if (validateCommunity.status) {
      toastMessage(t(validateCommunity.message), 'error');
      return;
    }

    if (isToggleOn) {
      const validate = landingPagevalidate(landingPage);
      if (validate.status) {
        toastMessage(t(validate.message), 'error');
        return;
      }
    }

    const landingData = prepareLandingPageData(landingPage);

    const payload = {
      id: Number(docId),
      name: formData.name || '',
      description: formData.description || '',
      version: formData.version || '',
      baseURL: formData.baseURL || '',
      url: formData.url || '',
      organizationName: formData.organizationName || '',
      projectName: formData.projectName || '',
      customCSS: formData.customCSS || customCSSInitial(),
      favicon: formData.favicon || '',
      navImage: formData.navImage || '',
      copyrightText: formData.copyrightText || '',
      metaImage: formData.metaImage || '',
      landerDetails: JSON.stringify(landingData),
      footerLabelLinks: socialPlatformField
        ? JSON.stringify(socialPlatformField)
        : [{ icon: '', link: '' }],
      moreLabelLinks: moreField
        ? JSON.stringify(moreField)
        : [{ label: '', link: '' }]
    };
    let result;

    setLoadingMessage(t('create_documentation_loading'));
    openModal('loadingModal');
    if (mode === 'edit') {
      result = await updateDocumentation(payload);
    } else {
      result = await createDocumentation(payload);
    }

    if (handleError(result, navigate, t)) {
      closeModal('loadingModal');
      return;
    }

    if (result.status === 'success') {
      closeModal('loadingModal');
      if (docId) {
        navigate(`/dashboard/documentation?id=${docId}`);
      } else {
        navigate('/');
      }
      if (mode === 'edit') {
        toastMessage(t('documentation_updated'), 'success');
      } else {
        toastMessage(t('documentation_created'), 'success');
      }
    }
  };
  const toggleEmojiPicker = (index) => {
    if (activeFieldIndex === index) {
      setShowEmojiPicker(!showEmojiPicker);
    } else {
      setActiveFieldIndex(index);
      setShowEmojiPicker(true);
    }
  };

  const handleMoreLabelChange = (index, newValue) => {
    const updatedFields = moreField.map((field, i) =>
      i === index ? { ...field, label: newValue } : field
    );
    setMoreField(updatedFields);
  };

  const handleMoreLinkChange = (index, newValue) => {
    const updatedFields = moreField.map((field, i) =>
      i === index ? { ...field, link: newValue } : field
    );
    setMoreField(updatedFields);
  };

  const updateCtaButtonText = (key, value) => {
    setLandingPage((prevState) => ({
      ...prevState,
      ctaButtonText: {
        ...prevState.ctaButtonText,
        [key]: value
      }
    }));
  };

  const updateSecondCtaButtonText = (key, value) => {
    setLandingPage((prevState) => ({
      ...prevState,
      secondCtaButtonText: {
        ...prevState.secondCtaButtonText,
        [key]: value
      }
    }));
  };

  const updateCtaImageLink = (value) => {
    setLandingPage((prevState) => ({
      ...prevState,
      ctaImageLink: value
    }));
  };

  const updateFeature = (index, key, value) => {
    const updatedFeatures = landingPage.features.map((feature, i) => {
      if (i === index) {
        return { ...feature, [key]: value };
      }
      return feature;
    });
    setLandingPage((prevState) => ({
      ...prevState,
      features: updatedFeatures
    }));
  };

  const handleEmojiClick = (index, emojiObject) => {
    updateFeature(index, 'emoji', emojiObject.unified);
    setShowEmojiPicker(false);
  };

  const [isOpen, setIsOpen] = useState(false);

  const handleOptionClick = (option, index) => {
    setIsOpen(false);
    const updatedSocialPlatformField = [...socialPlatformField];
    updatedSocialPlatformField[index] = {
      ...updatedSocialPlatformField[index],
      icon: option
    };
    setSocialPlatformField(updatedSocialPlatformField);
  };

  const handleSocialPlatformLinkChange = (index, newValue) => {
    const updatedFields = socialPlatformField.map((field, i) =>
      i === index ? { ...field, link: newValue } : field
    );
    setSocialPlatformField(updatedFields);
  };

  const convertToEmoji = (codePoint) => {
    console.log(codePoint);
    console.log(typeof(codePoint))
    if (/^[0-9a-fA-F]+$/.test(codePoint)) {
      return String.fromCodePoint(Number.parseInt(codePoint, 16));
    } else {
      return '';
    }
  };

  return (
    <AnimatePresence>
      <Breadcrumb />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        key="create-documentation-conatiner"
        className=" overflow-y-auto overflow-x-hidden  justify-center items-center w-full md:inset-0 md:h-full"
      >
        <div className="relative w-full h-full md:h-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-400">
              {mode === 'edit'
                ? t('edit_documentation')
                : t('new_documentation')}
            </h3>
          </div>

          <div className="relative bg-white rounded-lg shadow dark:bg-gray-800 sm:p-3">
            <div className="overflow-auto p-1">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('title_label')}<span className='text-red-500 ml-1'>*</span>
                    </span>
                    <input
                      ref={titleRef}
                      onChange={handleChange}
                      type="text"
                      value={formData?.name || ''}
                      name="name"
                      id="name"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                      placeholder={t('enter_new_document_name')}
                      required
                    />
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('version')}
                      <span className='text-red-500 ml-1'>*</span>
                    </span>
                    <input
                      onChange={handleChange}
                      value={formData?.version}
                      type="text"
                      name="version"
                      id="version"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                      placeholder={t('version_placeholder')}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('description')}
                      <span className='text-red-500 ml-1'>*</span>
                    </span>
                    <div>
                      <textarea
                        onChange={handleChange}
                        value={formData?.description}
                        name="description"
                        id="description"
                        className="bg-gray-50 border min-h-36 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        placeholder={t('description_placeholder')}
                        rows="3"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('custom_css')}
                    </span>
                    <AceEditor
                      mode="css"
                      theme={darkMode ? 'monokai' : 'github'}
                      onChange={(newValue) =>
                        handleChange({
                          target: { name: 'customCSS', value: newValue }
                        })
                      }
                      value={formData.customCSS}
                      name="customCSS"
                      editorProps={{ $blockScrolling: true }}
                      setOptions={{
                        useWorker: false,
                        showLineNumbers: true,
                        tabSize: 2
                      }}
                      style={{ width: '100%', height: '200px' }}
                      className="rounded-lg border border-gray-600"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('favicon')}
                    </span>
                    <input
                      type="url"
                      onChange={handleChange}
                      value={formData?.favicon}
                      name="favicon"
                      placeholder={t('favicon_placeholder')}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('navbar_icon')}
                    </span>
                    <input
                      onChange={handleChange}
                      value={formData?.navImage}
                      type="url"
                      name="navImage"
                      placeholder={t('navbar_icon_placeholder')}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('copyright_text')}
                      <span className='text-red-500 ml-1'>*</span>
                    </span>
                    <input
                      onChange={handleChange}
                      value={formData?.copyrightText}
                      type="text"
                      name="copyrightText"
                      placeholder={t('copyright_text_placeholder')}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('social_card_image')}
                      <span className='text-red-500 ml-1'>*</span>
                    </span>
                    <input
                      onChange={handleChange}
                      value={formData?.metaImage}
                      type="url"
                      name="metaImage"
                      placeholder={t('social_card_image_palceholder')}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('organization_name')}
                      <span className='text-red-500 ml-1'>*</span>
                    </span>
                    <input
                      onChange={handleChange}
                      value={formData?.organizationName}
                      type="text"
                      name="organizationName"
                      placeholder={t('organization_name_placeholder')}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('project_name')}
                      <span className='text-red-500 ml-1'>*</span>
                    </span>
                    <input
                      onChange={handleChange}
                      value={formData?.projectName}
                      type="url"
                      name="projectName"
                      placeholder={t('project_name_placeholder')}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('documentation_base_url')}
                      <span className='text-red-500 ml-1'>*</span>
                    </span>
                    <input
                      onChange={handleChange}
                      value={formData?.baseURL}
                      type="text"
                      name="baseURL"
                      placeholder={t('documentation_base_url_placeholder')}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('url')}
                      <span className='text-red-500 ml-1'>*</span>
                    </span>
                    <input
                      onChange={handleChange}
                      value={formData?.url}
                      type="text"
                      name="url"
                      placeholder={t('url_placeholder')}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-1 mb-4 sm:mb-3 mt-6">
                <div>
                  <div className="flex justify-between items-center">
                    <p className="block text-md font-medium text-gray-700 dark:text-gray-300 ">
                      {t('social_media_platform')}
                    </p>
                  </div>
                </div>
                <hr className="mt-2 mb-4 border-t-1 dark:border-gray-500" />
                {socialPlatformField &&
                  socialPlatformField.map((obj, index) => (
                    <div className="grid gap-4 grid-cols-2" key={index}>
                      <div className="relative">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('icon')}
                          <span className='text-red-500 ml-1'>*</span>
                        </span>
                        <button
                          onClick={() => {
                            setIsOpen(!isOpen);
                            setOpenDropdownIndex(index);
                          }}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                        >
                          {obj.icon ? (
                            <div className="w-full flex justify-start items-center">
                              {(() => {
                                const matchingIcon = SocialLinkIcon.find(
                                  (val) => val.value === obj.icon
                                );
                                return matchingIcon ? (
                                  <>
                                    <span>{matchingIcon.icon}</span>
                                    <span className="ml-2">
                                      {matchingIcon.iconName}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-gray-500">
                                    {t('icon_not_found')}
                                  </span>
                                );
                              })()}
                            </div>
                          ) : (
                            <ul className="w-full flex justify-between items-center">
                              <li className="ml-2">{t('choose_an_icon')}</li>
                              <li>
                                <Icon icon="mingcute:down-fill" />
                              </li>
                            </ul>
                          )}
                        </button>
                        {openDropdownIndex === index && isOpen && (
                          <div className="absolute z-10 w-full min-h-48 max-h-48 overflow-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg mt-1">
                            {SocialLinkIcon.map((option) => (
                              <div
                                key={option.value}
                                onClick={() =>
                                  handleOptionClick(option.value, index)
                                }
                                className="flex items-center py-2 px-4 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer"
                              >
                                {option.icon}
                                <span className="ml-2 text-md text-black dark:text-white">
                                  {option.iconName}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('link')}
                          <span className='text-red-500 ml-1'>*</span>
                        </span>
                        <input
                          onChange={(e) =>
                            handleSocialPlatformLinkChange(
                              index,
                              e.target.value
                            )
                          }
                          value={obj.link}
                          type="text"
                          name="url"
                          placeholder={t('social_link_placeholder')}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                        />
                      </div>
                    </div>
                  ))}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => addRow('social-platform-field')}
                    title={t('add_new_field')}
                    className="flex items-center gap-1 text-blue-600 rounded-lg text-sm"
                  >
                    <Icon
                      icon="ei:plus"
                      className="w-8 h-8 hover:text-blue-400"
                    />
                  </button>

                  <button
                    onClick={() => deleteRow('social-platform-field')}
                    title={t('delete_field')}
                    className="flex items-center gap-1 rounded-lg text-sm "
                  >
                    <Icon
                      icon="material-symbols:delete"
                      className="text-red-500 dark:text-red-600 hover:text-red-800 h-7 w-7"
                    />
                  </button>
                </div>
                <div>
                  <div className="flex justify-start items-center">
                    <span className="block text-md font-medium text-gray-700 dark:text-gray-300 ">
                      {t('more_footer')}
                    </span>
                  </div>

                  <hr className="mt-2 mb-4 border-t-1 dark:border-gray-500" />
                  {moreField &&
                    moreField.map((obj, index) => (
                      <div key={`more-label-${index}`}>
                        <LabelAndCommunityComponent
                          labelId={`more-label-${index}`}
                          linkId={`more-link-${index}`}
                          index={index}
                          data={obj}
                          onLabelChange={handleMoreLabelChange}
                          onLinkChange={handleMoreLinkChange}
                        />
                      </div>
                    ))}
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => addRow('more')}
                    title={t('add_new_field')}
                    className="flex items-center gap-1 text-blue-600 rounded-lg text-sm  py-1.5  mb-2 "
                  >
                    <Icon
                      icon="ei:plus"
                      className="w-8 h-8  hover:text-blue-400"
                    />
                  </button>

                  <button
                    onClick={() => deleteRow('more')}
                    title={t('delete_field')}
                    className="flex items-center gap-1 rounded-lg text-sm  py-1.5  mb-2 "
                  >
                    <Icon
                      icon="material-symbols:delete"
                      className="text-red-500 dark:text-red-600 hover:text-red-800  h-7 w-7"
                    />
                  </button>
                </div>
              </div>

              <label class="inline-flex items-center cursor-pointer gpa-5 mb-4">
                <span class="text-lg font-medium text-gray-900 dark:text-gray-300 mr-3">
                  {t('enable_landing_page')}
                </span>
                <input
                  type="checkbox"
                  checked={isToggleOn}
                  onChange={(e) => {
                    SetIsToggleOn(e.target.checked);
                  }}
                  class="sr-only peer"
                />
                <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>

              {isToggleOn && (
                <div className="">
                  <div className="grid gap-4 sm:grid-cols-3 mb-5">
                    <div>
                      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('cta_button_text')}
                        <span className='text-red-500 ml-1'>*</span>
                      </span>
                      <input
                        type="url"
                        onChange={(e) =>
                          updateCtaButtonText(
                            'ctaButtonLinkLabel',
                            e.target.value
                          )
                        }
                        value={landingPage?.ctaButtonText?.ctaButtonLinkLabel}
                        name="favicon"
                        placeholder={t('cta_button_text_placeholder')}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('cta_button_link')}
                        <span className='text-red-500 ml-1'>*</span>
                      </span>
                      <input
                        onChange={(e) =>
                          updateCtaButtonText('ctaButtonLink', e.target.value)
                        }
                        value={landingPage?.ctaButtonText?.ctaButtonLink}
                        type="url"
                        name="navImage"
                        placeholder={t('cta_button_link_placeholder')}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3 mb-5">
                    <div>
                      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('second_cta_button_text')}
                      </span>
                      <input
                        type="url"
                        onChange={(e) =>
                          updateSecondCtaButtonText(
                            'ctaButtonLinkLabel',
                            e.target.value
                          )
                        }
                        value={
                          landingPage?.secondCtaButtonText?.ctaButtonLinkLabel
                        }
                        name="second_cta_button_text"
                        placeholder={t('second_cta_button_text_placeholder')}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('second_cta_button_link')}
                      </span>
                      <input
                        onChange={(e) =>
                          updateSecondCtaButtonText(
                            'ctaButtonLink',
                            e.target.value
                          )
                        }
                        value={landingPage?.secondCtaButtonText?.ctaButtonLink}
                        type="url"
                        name="navImage"
                        placeholder={t('second_cta_link_placeholder')}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('cta_image_link')}
                        <span className='text-red-500 ml-1'>*</span>
                      </span>
                      <input
                        onChange={(e) => updateCtaImageLink(e.target.value)}
                        value={landingPage.ctaImageLink || ''}
                        type="url"
                        name="ctaImageLink"
                        placeholder={t('cta_image_link_palceholder')}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-start items-center">
                    <span className="block text-md font-medium text-gray-700 dark:text-gray-300 ">
                      {t('features')}
                    </span>
                  </div>
                  <hr className="mt-2 mb-4 border-t-1 dark:border-gray-500" />

                  {landingPage.features.map((obj, index) => (
                    <div className="grid gap-4 grid-cols-3" key={index}>
                      <div className="relative">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('emoji')}
                        </span>
                        <input
                          ref={(el) => (inputRefs.current[index] = el)}
                          onFocus={() => toggleEmojiPicker(index)}
                          placeholder={convertToEmoji('26a1')}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                          value={convertToEmoji(obj.emoji)}
                        />
                        {activeFieldIndex === index && showEmojiPicker && (
                          <div
                            ref={pickerRef}
                            className={
                              'absolute left-0 bg-white rounded-lg shadow w-52 dark:bg-gray-700 z-30'
                            }
                            style={{ transform: 'translateY(-110%)' }}
                          >
                          <Picker data={data} onEmojiSelect={(emoji) => handleEmojiClick(index, emoji)}/>
                          </div>
                        )}
                      </div>

                      <div className='relative'>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('title_label')}
                        </span>
                        <input
                          onChange={(e) =>
                            updateFeature(index, 'title', e.target.value)
                          }
                          value={obj.title}
                          type="text"
                          placeholder={t('landing_page_title_placeholder')}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                        />
                      </div>

                      <div className='relative'> 
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('text')}
                        </span>
                        <input
                          onChange={(e) =>
                            updateFeature(index, 'text', e.target.value)
                          }
                          value={obj.text}
                          type="text"
                          id="feature_desc"
                          placeholder={t('text_placeholder')}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => addRow('feature-filed')}
                      title={t('add_new_field')}
                      className="flex items-center gap-1 text-blue-600 rounded-lg text-sm  py-1.5  mb-2 "
                    >
                      <Icon
                        icon="ei:plus"
                        className="w-8 h-8  hover:text-blue-400"
                      />
                    </button>

                    <button
                      onClick={() => deleteRow('feature-filed')}
                      title={t('delete_field')}
                      className="flex items-center gap-1 rounded-lg text-sm  py-1.5  mb-2 "
                    >
                      <Icon
                        icon="material-symbols:delete"
                        className="text-red-500 dark:text-red-600 hover:text-red-800  h-7 w-7"
                      />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-center items-center mt-7">
                <button
                  onClick={handleCreateDocument}
                  type="submit"
                  className="flex justify-center items-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                >
                  <span>
                    {mode === 'edit'
                      ? t('update_documentation')
                      : t('new_documentation')}
                  </span>
                  {!mode && <Icon icon="ei:plus" className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
