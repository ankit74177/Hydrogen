import React from 'react';
const generateHTML = (data) => {
    if (!data || !data.section) {
      return null;
    }
    return (
      <div className='row'>
        {data.section.map((section, sectionIndex) => (
          <div key={sectionIndex} className={section.section_class}>
            {section.type && section.tag && section.value && (
              <ElementRenderer type={section.type} tag={section.tag} value={section.value} />
            )}
            <div className={section.class}>
                {section.row && section.row.map((columnData, columnIndex) => (
                    <div key={columnIndex} className={columnData.class}>
                    {columnData.link === 'false' ? (
                        columnData.column.map((elementData, elementIndex) => (
                        <ElementRenderer key={elementIndex} {...elementData} />
                        ))
                    ) : null}
                    </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const ElementRenderer = ({ type, tag, value, class: className, href }) => {
    const commonProps = { key: className, className };
    switch (type) {
      case 'heading':
        return React.createElement(tag, commonProps, value);
      case 'image':
        return <img {...commonProps} src={value} alt={className} className="w-100" />;
      case 'paragraph':
        return React.createElement(tag, commonProps, value);
      case 'button':
        return <button {...commonProps}>{value}</button>;
      case 'link':
        return <a {...commonProps} href={href}>{value}</a>;
      default:
        return null;
    }
  };
  
  export function Section({data}) {
    return generateHTML(JSON.parse(data));
  }