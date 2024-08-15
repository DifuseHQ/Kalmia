import {
  Block,
  BlockNoteEditor,
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultProps,
  insertOrUpdateBlock,
} from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import warnIcon from "@iconify/icons-mdi/alert";
import errorIcon from "@iconify/icons-mdi/alert-circle";
import successIcon from "@iconify/icons-mdi/check-circle";
import infoIcon from "@iconify/icons-mdi/information";
import { Icon, IconifyIcon } from "@iconify/react/dist/iconify.js";
import { Menu } from "@mantine/core";
import { langs, LanguageName } from "@uiw/codemirror-extensions-langs";
import ReactCodeMirror from "@uiw/react-codemirror";

interface alertType {
  title: string;
  value: "warning" | "danger" | "info" | "success" | undefined;
  icon: IconifyIcon;
  color: string;
  backgroundColor: {
    light: string;
    dark: string;
  };
}

export const alertTypes: alertType[] = [
  {
    title: "Warning",
    value: "warning",
    icon: warnIcon,
    color: "#e69819",
    backgroundColor: {
      light: "#fff6e6",
      dark: "#805d20",
    },
  },
  {
    title: "Danger",
    value: "danger",
    icon: errorIcon,
    color: "#d80d0d",
    backgroundColor: {
      light: "#ffe6e6",
      dark: "#802020",
    },
  },
  {
    title: "Info",
    value: "info",
    icon: infoIcon,
    color: "#507aff",
    backgroundColor: {
      light: "#e6ebff",
      dark: "#203380",
    },
  },
  {
    title: "Success",
    value: "success",
    icon: successIcon,
    color: "#0bc10b",
    backgroundColor: {
      light: "#e6ffe6",
      dark: "#208020",
    },
  },
];

export const Alert = createReactBlockSpec(
  {
    type: "alert",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      type: {
        default: "warning",
        values: ["warning", "danger", "info", "success"],
      },
    },
    content: "inline",
  },
  {
    render: (props) => {
      const alertType = alertTypes?.find(
        (a) => a.value === props.block.props.type,
      );
      return (
        <div className="alert" data-alert-type={props.block.props.type}>
          <Menu withinPortal={false} zIndex={999999}>
            <Menu.Target>
              <div className="alert-icon-wrapper" contentEditable={false}>
                <Icon
                  icon={alertType?.icon || warnIcon}
                  className="alert-icon"
                  data-alert-icon-type={props.block.props.type}
                  fontSize={32}
                />
              </div>
            </Menu.Target>
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
                        type: "alert",
                        props: { type: type.value },
                      })
                    }
                  >
                    {type.title}
                  </Menu.Item>
                );
              })}
            </Menu.Dropdown>
          </Menu>
          <div className="inline-content" ref={props.contentRef} />
        </div>
      );
    },
  },
);

export const CODEBLOCK_TYPE = "procode";

function isValidLanguage(lang: string): lang is LanguageName {
  return lang in langs;
}

export const CodeBlock = createReactBlockSpec(
  {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    type: CODEBLOCK_TYPE,
    propSchema: {
      language: {
        default: "javascript",
      },
      code: {
        default: "",
      },
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const language = block.props.language || "javascript";
      const code = block.props.code || "";

      const onInputChange = (val: string) => {
        editor.updateBlock(block, {
          props: { ...block.props, code: val },
        });
      };

      const languageExtension = isValidLanguage(language)
        ? langs[language]
        : langs.javascript;

      return (
        <ReactCodeMirror
          id={block.id}
          autoFocus
          placeholder={"Write your code here..."}
          style={{ width: "100%", resize: "vertical" }}
          extensions={[languageExtension()]}
          value={code}
          theme={"dark"}
          editable={editor.isEditable}
          width="100%"
          height="200px"
          onChange={onInputChange}
        />
      );
    },
    toExternalHTML: ({ block }) => {
      return (
        <pre>
          <code>{block.props.code}</code>
        </pre>
      );
    },
  },
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    alert: Alert,
    procode: CodeBlock,
  },
});

export const insertAlert = (editor: typeof schema.BlockNoteEditor) => ({
  title: "alert",
  subtext: "This is a notification alert.",
  onItemClick: () => {
    insertOrUpdateBlock(editor, {
      type: "alert",
    });
  },
  aliases: [
    "alert",
    "notification",
    "emphasize",
    "warning",
    "error",
    "info",
    "success",
  ],
  group: "Alert",
  icon: <Icon icon={warnIcon} />,
});

export const insertCode = (editor: BlockNoteEditor) => ({
  title: "Code",
  group: "Other",
  onItemClick: () => {
    insertOrUpdateBlock(editor, {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      type: CODEBLOCK_TYPE,
    });
  },
  aliases: ["code"],
  icon: "code",
  subtext: "Insert a code block.",
});

export const handleBacktickInput = (editor: BlockNoteEditor) => {
  const backtickInputRegex = /^```([a-z]*)[\s\n]?/;
  const cursorPosition = editor.getTextCursorPosition();

  if (!cursorPosition || !cursorPosition.block) {
    return false;
  }

  const currentBlock = cursorPosition.prevBlock;

  if (!currentBlock) {
    return false;
  }

  const blockContent: Block | undefined = editor.getBlock(currentBlock.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = (blockContent?.content as any[])?.[0]?.text ?? "";
  const match = text.match(backtickInputRegex);

  if (match) {
    const language = match[1] || "javascript";
    editor.updateBlock(currentBlock, {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      type: CODEBLOCK_TYPE,
      props: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        language,
        code: "",
      },
    });
    return true;
  }

  return false;
};
