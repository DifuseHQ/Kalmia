import { useCallback } from 'react';
import { defaultProps } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import warnIcon from '@iconify/icons-mdi/alert';
import errorIcon from '@iconify/icons-mdi/alert-circle';
import successIcon from '@iconify/icons-mdi/check-circle';
import infoIcon from '@iconify/icons-mdi/information';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Menu } from '@mantine/core';
import { langs } from '@uiw/codemirror-extensions-langs';
import ReactCodeMirror from '@uiw/react-codemirror';

export const alertTypes = [
  {
    title: 'Warning',
    value: 'warning',
    icon: warnIcon,
    color: '#e69819',
    backgroundColor: {
      light: '#fff6e6',
      dark: '#805d20'
    }
  },
  {
    title: 'Danger',
    value: 'danger',
    icon: errorIcon,
    color: '#d80d0d',
    backgroundColor: {
      light: '#ffe6e6',
      dark: '#802020'
    }
  },
  {
    title: 'Info',
    value: 'info',
    icon: infoIcon,
    color: '#507aff',
    backgroundColor: {
      light: '#e6ebff',
      dark: '#203380'
    }
  },
  {
    title: 'Success',
    value: 'success',
    icon: successIcon,
    color: '#0bc10b',
    backgroundColor: {
      light: '#e6ffe6',
      dark: '#208020'
    }
  }
];

export const Alert = createReactBlockSpec(
  {
    type: 'alert',
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      type: {
        default: 'warning',
        values: ['warning', 'danger', 'info', 'success']
      }
    },
    content: 'inline'
  },
  {
    render: (props) => {
      const alertType = alertTypes?.find(
        (a) => a.value === props.block.props.type
      );
      return (
        <div className="alert" data-alert-type={props.block.props.type}>
          {/* Icon which opens a menu to choose the Alert type */}
          <Menu withinPortal={false} zIndex={999999}>
            <Menu.Target>
              <div className="alert-icon-wrapper" contentEditable={false}>
                <Icon
                  icon={alertType.icon}
                  className="alert-icon"
                  data-alert-icon-type={props.block.props.type}
                  fontSize={32}
                />
              </div>
            </Menu.Target>
            {/* Dropdown to change the Alert type */}
            <Menu.Dropdown>
              <Menu.Label>Alert Type</Menu.Label>
              <Menu.Divider />
              {alertTypes.map((type) => {
                return (
                  <Menu.Item
                    key={type.value}
                    leftSection={
                      <Icon
                        icon={type.icon}
                        className="alert-icon"
                        data-alert-icon-type={type.value}
                        width={26}
                        height={26}
                      />
                    }
                    onClick={() =>
                      props.editor.updateBlock(props.block, {
                        type: 'alert',
                        props: { type: type.value }
                      })
                    }
                  >
                    {type.title}
                  </Menu.Item>
                );
              })}
            </Menu.Dropdown>
          </Menu>
          {/* Rich text field for user to type in */}
          <div className="inline-content" ref={props.contentRef} />
        </div>
      );
    }
  }
);

export const insertAlert = (editor) => ({
  title: 'alert',
  subtext: 'This is a notification alert.',
  onItemClick: () => {
    editor.insertBlocks(
      [{ type: 'alert' }],
      editor.getTextCursorPosition().block,
      'after'
    );
  },
  aliases: [
    'alert',
    'notification',
    'emphasize',
    'warning',
    'error',
    'info',
    'success'
  ],
  group: 'Alert',
  icon: <Icon icon={warnIcon} />
});

export const CODEBLOCK_TYPE = 'procode';

export const CodeBlockComponent = ({ block, editor }) => {
  const code = block.props.code || '';
  const language = block.props.language || 'plain';

  const handleChange = useCallback((value) => {
    editor.updateBlock(block, {
      props: { code: value, language }
    });
  }, [block, editor, language]);

  const languageExtension = langs[language] || langs.javascript;

  return (
    <div className="w-full rounded-lg shadow-md">
      <ReactCodeMirror
        key={language}
        value={code}
        onChange={handleChange}
        extensions={[languageExtension()]}
        theme="dark"
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true
        }}
      />
    </div>
  );
};

export const CodeBlock = createReactBlockSpec(
  {
    type: CODEBLOCK_TYPE,
    propSchema: {
      code: { default: '' },
      language: { default: 'plain' }
    },
    content: 'none'
  },
  {
    render: ({ block, editor }) => <CodeBlockComponent block={block} editor={editor} />,
    toExternalHTML: ({ block }) => {
      return (
        <pre>
          <code className={`language-${block?.props?.language}`}>{block?.props?.code}</code>
        </pre>
      );
    }
  }
);

export const insertCode = (editor) => ({
  title: 'Code',
  group: 'Other',
  onItemClick: () => {
    editor.insertBlocks(
      [{
        type: CODEBLOCK_TYPE,
        props: {
          code: '',
          language: 'plain'
        }
      }],
      editor.getTextCursorPosition().block,
      'after'
    );
  },
  aliases: ['code'],
  icon: 'code',
  subtext: 'Insert a code block.'
});

export const handleBacktickInput = (editor) => {
  const backtickInputRegex = /^```([a-z]*)[\s\n]?/;
  const cursorPosition = editor.getTextCursorPosition();

  if (!cursorPosition || !cursorPosition.block) {
    return false;
  }

  const currentBlock = cursorPosition.prevBlock;

  if (!currentBlock) {
    return false;
  }

  const blockContent = editor.getBlock(currentBlock.id);
  const text = blockContent.content?.[0]?.text || '';
  const match = text.match(backtickInputRegex);

  if (match) {
    const language = match[1] || 'plain';
    editor.updateBlock(currentBlock, {
      type: CODEBLOCK_TYPE,
      props: {
        language,
        code: ''
      }
    });
    return true;
  }

  return false;
};
