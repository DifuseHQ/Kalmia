import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';

import { createDocumentation, getDocumentation, updateDocumentation } from '../../api/Requests';
import { handleError } from '../../utils/Common';
import { toastMessage } from '../../utils/Toast';

const LabelAndCommunityComponent = ({
  index,
  labelId,
  communityId,
  data,
  onLabelChange,
  onCommunityChange
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid gap-4 sm:grid-cols-2 my-2"
      key={`footer-more-field-${index}`}
    >
      <div>
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Label
        </span>
        <input
          type="text"
          id={labelId}
          value={data?.label}
          name={index}
          onChange={(e) => onLabelChange(index, e.target.value)}
          placeholder="Enter label text"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
        />
      </div>
      <div>
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Community
        </span>
        <input
          type="text"
          value={data?.community}
          id={communityId}
          name={index}
          onChange={(e) => onCommunityChange(index, e.target.value)}
          placeholder="Paste the community link"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
        />
      </div>
    </motion.div>
  );
};

export default function CreateDocModal () {
  const navigate = useNavigate();
  const [searchParam] = useSearchParams();
  const docId = searchParam.get('id');
  const mode = searchParam.get('mode');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '',
    customCSS: '',
    favicon: '',
    navImage: '',
    copyrightText: '',
    metaImage: ''
  });

  const [footerField, setFooterField] = useState([
    { label: '', community: '' }
  ]);
  const [moreField, setMoreField] = useState([{ label: '', community: '' }]);

  useEffect(() => {
    if (mode === 'edit') {
      const fetchDoc = async () => {
        const result = await getDocumentation(Number(docId));
        if (result.status === 'success') {
          setFormData(result?.data);
          const footerLabelLinks = result?.data?.footerLabelLinks;
          const moreLabelLinks = result?.data?.moreLabelLinks;

          setFooterField(
            footerLabelLinks ? JSON.parse(footerLabelLinks) : [{ label: '', community: '' }]
          );
          setMoreField(
            moreLabelLinks ? JSON.parse(moreLabelLinks) : [{ label: '', community: '' }]
          );
        } else {
          handleError(result, navigate);
        }
      };
      fetchDoc();
    } else {
      setFormData({
        name: '',
        description: '',
        version: '',
        customCSS: '',
        favicon: '',
        navImage: '',
        copyrightText: '',
        metaImage: ''
      });
      setFooterField([{ label: '', community: '' }]);
      setMoreField([{ label: '', community: '' }]);
    }
  }, [docId, mode, navigate]);

  const addRow = (fieldType) => {
    if (fieldType === 'footer') {
      setFooterField([...footerField, { label: '', community: '' }]);
    } else if (fieldType === 'more') {
      setMoreField([...moreField, { label: '', community: '' }]);
    }
  };

  const deleteRow = (fieldType) => {
    if (fieldType === 'footer') {
      if (footerField.length > 1) {
        setFooterField(footerField.slice(0, -1));
      }
    } else if (fieldType === 'more') {
      if (moreField.length > 1) {
        setMoreField(moreField.slice(0, -1));
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
    if (formData.name === '') {
      toastMessage(
        'Title is required. Please enter a new Document Title.',
        'warning'
      );
      return;
    }

    if (formData.description === '') {
      toastMessage(
        'Description is required. Please enter a new Document Description.',
        'warning'
      );
      return;
    }

    if (formData.version === '') {
      toastMessage('Version is required. Please enter a new.', 'warning');
      return;
    }

    const payload = {
      id: Number(docId),
      name: formData.name || '',
      description: formData.description || '',
      version: formData.version || '',
      customCSS: formData.customCSS || '',
      favicon: formData.favicon || '',
      navImage: formData.navImage || '',
      copyrightText: formData.copyrightText || '',
      metaImage: formData.metaImage || '',
      footerLabelLinks: footerField ? JSON.stringify(footerField) : [{ label: '', community: '' }],
      moreLabelLinks: moreField ? JSON.stringify(moreField) : [{ label: '', community: '' }]
    };
    let result;
    if (mode === 'edit') {
      result = await updateDocumentation(payload);
    } else {
      result = await createDocumentation(payload);
    }

    if (result.status === 'success') {
      if (docId) {
        navigate(`/dashboard/documentation?id=${docId}`);
      } else {
        navigate('/');
      }

      toastMessage('Document created successfully', 'success');
    } else {
      handleError(result, navigate);
    }
  };

  const handleFooterLabelChange = (index, newValue) => {
    const updatedFields = footerField.map((field, i) =>
      i === index ? { ...field, label: newValue } : field
    );
    setFooterField(updatedFields);
  };

  const handleFooterCommunityChange = (index, newValue) => {
    const updatedFields = footerField.map((field, i) =>
      i === index ? { ...field, community: newValue } : field
    );
    setFooterField(updatedFields);
  };

  const handleMoreLabelChange = (index, newValue) => {
    const updatedFields = moreField.map((field, i) =>
      i === index ? { ...field, label: newValue } : field
    );
    setMoreField(updatedFields);
  };

  const handleMoreCommunityChange = (index, newValue) => {
    const updatedFields = moreField.map((field, i) =>
      i === index ? { ...field, community: newValue } : field
    );
    setMoreField(updatedFields);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        key="create-documentation-conatiner"
        className=" overflow-y-auto overflow-x-hidden  justify-center items-center w-full md:inset-0 md:h-full"
      >
        <div className="relative w-full max-w-5xl h-full md:h-auto mx-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-400">
            {mode === 'edit' ? 'Edit Documentation' : 'New Documentation'}
            </h3>
          </div>

          <div className="relative bg-white rounded-lg shadow dark:bg-gray-800 sm:p-3">
            <div className="overflow-auto p-1">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title
                    </span>
                    <input
                      ref={titleRef}
                      onChange={handleChange}
                      type="text"
                      value={formData?.name || ''}
                      name="name"
                      id="name"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      placeholder="Enter new document name"
                      required
                    />
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Version
                    </span>
                    <input
                      onChange={handleChange}
                      value={formData?.version}
                      type="text"
                      name="version"
                      id="version"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      placeholder="Enter document version"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </span>
                    <div>
                      <textarea
                        onChange={handleChange}
                        value={formData?.description}
                        name="description"
                        id="description"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                        placeholder="Description about your new document"
                        rows="3"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Custom CSS
                    </span>
                    <div>
                      <textarea
                        onChange={handleChange}
                        value={formData?.customCSS}
                        name="customCSS"
                        id="customCSS"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                        placeholder="Enter custom css styles"
                        rows="3"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fav Icon
                    </span>
                    <input
                      type="url"
                      onChange={handleChange}
                      value={formData?.favicon}
                      name="favicon"
                      placeholder="Paste your fav icon link"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Navbar Icon
                    </span>
                    <input
                      onChange={handleChange}
                      value={formData?.navImage}
                      type="url"
                      name="navImage"
                      placeholder="Paste your navbar icon link"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Copyright Text
                    </span>
                    <input
                      onChange={handleChange}
                      value={formData?.copyrightText}
                      type="text"
                      name="copyrightText"
                      placeholder="Enter copy wright text"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Social Card Image
                    </span>
                    <input
                      onChange={handleChange}
                      value={formData?.metaImage}
                      type="url"
                      name="metaImage"
                      placeholder="Paste social card image link"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-1 mb-4 sm:mb-3 mt-6">
                <div>
                  <div className="flex justify-between items-center">
                    <p className="block text-md font-medium text-gray-700 dark:text-gray-300 ">
                      Footer
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => addRow('footer')}
                        title="add new field"
                        className="flex items-center gap-1 text-blue-600 rounded-lg text-sm"
                      >
                        <Icon
                          icon="ei:plus"
                          className="w-8 h-8 hover:text-blue-400"
                        />
                      </button>

                      <button
                        onClick={() => deleteRow('footer')}
                        title="delete field"
                        className="flex items-center gap-1 rounded-lg text-sm "
                      >
                        <Icon
                          icon="material-symbols:delete"
                          className="text-red-500 dark:text-red-600 hover:text-red-800 h-7 w-7"
                        />
                      </button>
                    </div>
                  </div>
                </div>
                <hr className="mt-2 mb-4 border-t-1 dark:border-gray-500" />
                {footerField.map((obj, index) => (
                  <div key={`footer-label-${index}`}>
                    <LabelAndCommunityComponent
                      labelId={`footer-label-${index}`}
                      communityId={`footer-community-${index}`}
                      index={index}
                      data={obj}
                      onLabelChange={handleFooterLabelChange}
                      onCommunityChange={handleFooterCommunityChange}
                    />
                  </div>
                ))}

                <div>
                  <div className="flex justify-between items-center">
                    <span className="block text-md font-medium text-gray-700 dark:text-gray-300 ">
                      More
                    </span>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => addRow('more')}
                        title="add new field"
                        className="flex items-center gap-1 text-blue-600 rounded-lg text-sm  py-1.5  mb-2 "
                      >
                        <Icon
                          icon="ei:plus"
                          className="w-8 h-8  hover:text-blue-400"
                        />
                      </button>

                      <button
                        onClick={() => deleteRow('more')}
                        title="delete field"
                        className="flex items-center gap-1 rounded-lg text-sm  py-1.5  mb-2 "
                      >
                        <Icon
                          icon="material-symbols:delete"
                          className="text-red-500 dark:text-red-600 hover:text-red-800  h-7 w-7"
                        />
                      </button>
                    </div>
                  </div>

                  <hr className="mt-2 mb-4 border-t-1 dark:border-gray-500" />
                  {moreField.map((obj, index) => (
                    <div key={`more-label-${index}`}>
                      <LabelAndCommunityComponent
                        labelId={`more-label-${index}`}
                        communityId={`more-community-${index}`}
                        index={index}
                        data={obj}
                        onLabelChange={handleMoreLabelChange}
                        onCommunityChange={handleMoreCommunityChange}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center items-center mt-7">
                <button
                  onClick={handleCreateDocument}
                  type="button"
                  className="flex justify-center items-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                >
                  <span>{mode === 'edit' ? 'Update Documentation' : 'New Documentation'}</span>
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
