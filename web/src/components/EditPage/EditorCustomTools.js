import { defaultProps } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import warnIcon from '@iconify/icons-mdi/alert';
import errorIcon from '@iconify/icons-mdi/alert-circle';
import successIcon from '@iconify/icons-mdi/check-circle';
import infoIcon from '@iconify/icons-mdi/information';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Menu } from '@mantine/core';

// The types of alerts that users can choose from.
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

// The Alert block.
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
