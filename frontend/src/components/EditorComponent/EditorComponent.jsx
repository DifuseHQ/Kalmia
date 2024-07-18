import './EditorComponent.css';
import React, { useCallback, useEffect, useRef } from 'react';
import EditorJs from '@editorjs/editorjs';
import Header from 'editorjs-header-with-alignment';
import Quote from '@editorjs/quote';
import Alert from 'editorjs-alert';
import Title from 'title-editorjs';
import Table from '@editorjs/table';
import Undo from 'editorjs-undo';
import NestedList from '@editorjs/nested-list';
import Checklist from '@editorjs/checklist';
import editorjsNestedChecklist from '@calumk/editorjs-nested-checklist';
import Embed from '@editorjs/embed';
import ImageTool from '@editorjs/image';
import SimpleImage from '@editorjs/simple-image';
import Marker from '@editorjs/marker';
import InlineCode from '@editorjs/inline-code';
import Underline from '@editorjs/underline';
import Hyperlink from 'editorjs-hyperlink';
import instance from '../../api/AxiosInstance';
import axios from 'axios';
import { getTokenFromCookies } from '../../utils/CookiesManagement';

export default function EditorComponent ({
  onSave,
  pageId
}) {
  const editorjsInstance = useRef(null);

  const initEditor = useCallback(async (serverData) => {
    const editor = new EditorJs({
      holder: 'editorjs',
      onReady: () => {
        new Undo({ editor }); // eslint-disable-line no-new
      },
      data: serverData || [],
      onChange: async () => {
        const content = await editor.save();
        if (onSave) {
          onSave(content);
        }
      },
      tools: {
        title: Title,
        header: {
          class: Header,
          config: {
            placeholder: 'Enter a header',
            levels: [2, 3, 4],
            defaultLevel: 3
          }
        },
        quote: Quote,
        alert: Alert,
        table: Table,
        nestedList: {
          class: NestedList,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered'
          }
        },
        checklist: {
          class: Checklist,
          inlineToolbar: true
        },
        nestedchecklist: editorjsNestedChecklist,
        embed: {
          class: Embed,
          config: {
            services: {
              youtube: true,
              facebook: true,
              github: true,
              twitter: true,
              instagram: true
            }
          }
        },
        image: SimpleImage,
        imageblock: {
          class: ImageTool,
          config: {
            uploader: {
              async uploadByFile (file) {
                const formData = new FormData();
                formData.append('upload', file);
                const token = getTokenFromCookies();

                const response = await axios.post(
                  'http://[::1]:2727/auth/user/upload-photo',
                  formData,
                  {
                    headers: {
                      'Content-Type': 'multipart/form-data',
                      Authorization: `Bearer ${token}`
                    }
                  }
                );
                if (response?.status === 200) {
                  const imageUrl = response?.data?.photo;
                  return { success: 1, file: { url: imageUrl } };
                }
              }
            }
          }
        },
        Marker: {
          class: Marker,
          shortcut: 'CMD+SHIFT+M'
        },
        inlineCode: {
          class: InlineCode,
          shortcut: 'CMD+SHIFT+C'
        },
        underline: Underline,
        hyperlink: {
          class: Hyperlink,
          config: {
            shortcut: 'CMD+L',
            target: '_blank',
            rel: 'nofollow',
            availableTargets: ['_blank', '_self'],
            availableRels: ['author', 'noreferrer'],
            validate: false
          }
        }
      }
    });

    editorjsInstance.current = editor;
  }, []);

  useEffect(() => {
    const fetchDataAndInitializeEditor = async () => {
      if (pageId) {
        try {
          const serverResponse = await instance.post('docs/page', {
            id: Number(pageId)
          });
          const serverData = serverResponse.data.content;
          const parsedData = JSON.parse(serverData);
          initEditor(parsedData);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      } else {
        initEditor();
      }
    };

    fetchDataAndInitializeEditor();

    return () => {
      if (editorjsInstance.current) {
        editorjsInstance.current = null;
      }
    };
  }, [pageId]);

  return <div id='editorjs' />;
}
