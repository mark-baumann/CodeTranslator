import React, { FC, useState } from 'react';
import JSZip from 'jszip';


 interface FileNode {
    name?: string;
    isDirectory?: boolean;
    children?: FileNode[];
    file?: any;
    ref?: any;
  }
  
  export const FileTree: FC<FileNode> = ({ name, isDirectory, file, ref })  => {

  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  
  

  

    
  const renderZIP = async (file: any) => {
    try {
      const zip = await JSZip.loadAsync(file);
      const fileTree = getFileTreeFromZip(zip);
      //readZipFiless(zip)
      setFileTree(fileTree);
    } catch (error) {
      //console.error('Error:', error);
    }
  }

  renderZIP(file)

 



  const getFileTreeFromZip = (zip: JSZip): FileNode[] => {
    const fileTree: FileNode[] = [];

    zip.forEach((relativePath, zipEntry) => {
      const pathArr = relativePath.split('/');
      let current = fileTree;

      for (let i = 0; i < pathArr.length; i++) {
        const segment = pathArr[i];
        const isLast = i === pathArr.length - 1;

        const existingNode = current.find((node) => node.name === segment);
        if (existingNode) {
          if (isLast) {
            existingNode.isDirectory = false;
          }
          current = existingNode.children!;
        } else {
          const newNode: FileNode = {
            name: segment,
            isDirectory: isLast ? false : true,
            children: isLast ? undefined : [],
          };
          current.push(newNode);
          current = newNode.children!;
        }
      }
    });

    return fileTree;
  };

  const renderFileTree = (fileTree: FileNode[], level = 0) => {
    return (
      <ul>
        {fileTree.map((node) => (
          <li key={node.name} style={{ marginLeft: level * 20 }}>
            {node.isDirectory && (
              <>
                <strong>{node.name}/</strong>
                {node.children && renderFileTree(node.children, level + 1)}
              </>
            )}
            {!node.isDirectory && <span>{node.name}</span>}
          </li>
        ))}
      </ul>
    );
  };


  

  
 
  

  return (
    
      renderFileTree(fileTree)
    

    
  );
};
