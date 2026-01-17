import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  Folder,
  File,
  Upload,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
} from 'lucide-react-native';
import { pick, types } from '@react-native-documents/picker';

/* ---------- SAFE ID GENERATOR (RN COMPATIBLE) ---------- */
const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

/* ---------- TYPES ---------- */
type ItemType = 'folder' | 'file';

type Item = {
  id: string;
  name: string;
  type: ItemType;
  children?: Item[];
};

export default function FileManagerScreen() {
  const [root, setRoot] = useState<Item[]>([]);
  const [path, setPath] = useState<Item[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const current =
    path.length === 0 ? root : path[path.length - 1].children!;

  const updateTree = (updated: Item[]) => {
    if (path.length === 0) {
      setRoot(updated);
    } else {
      const newPath = [...path];
      newPath[newPath.length - 1] = {
        ...newPath[newPath.length - 1],
        children: updated,
      };
      setPath(newPath);
    }
  };

  /* ---------- CREATE ---------- */
  const createFolder = () => {
    updateTree([
      ...current,
      {
        id: generateId(),
        name: 'New Folder',
        type: 'folder',
        children: [],
      },
    ]);
  };

  const createFile = () => {
    updateTree([
      ...current,
      {
        id: generateId(),
        name: 'New File.txt',
        type: 'file',
      },
    ]);
  };

  /* ---------- UPLOAD ---------- */
  const uploadFile = async () => {
    try {
      const [file] = await pick({ type: [types.allFiles] });
      updateTree([
        ...current,
        {
          id: generateId(),
          name: file.name ?? 'Unknown',
          type: 'file',
        },
      ]);
    } catch {
      /* user cancelled */
    }
  };

  /* ---------- RENAME ---------- */
  const saveRename = (id: string) => {
    updateTree(
      current.map(item =>
        item.id === id ? { ...item, name: tempName } : item
      )
    );
    setEditingId(null);
  };

  /* ---------- DELETE ---------- */
  const deleteItem = (id: string) => {
    updateTree(current.filter(item => item.id !== id));
  };

  /* ---------- NAVIGATION ---------- */
  const openFolder = (item: Item) => setPath([...path, item]);
  const goBack = () => setPath(path.slice(0, -1));

  /* ---------- RENDER ITEM ---------- */
  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.left}
        onPress={() => item.type === 'folder' && openFolder(item)}
      >
        {item.type === 'folder' ? (
          <Folder size={24} color="#facc15" />
        ) : (
          <File size={22} color="#60a5fa" />
        )}
        {editingId === item.id ? (
          <TextInput
            autoFocus
            value={tempName}
            onChangeText={setTempName}
            onBlur={() => saveRename(item.id)}
            style={styles.input}
          />
        ) : (
          <Text style={styles.name}>{item.name}</Text>
        )}
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => {
            setEditingId(item.id);
            setTempName(item.name);
          }}
        >
          <Pencil size={18} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteItem(item.id)}>
          <Trash2 size={18} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ---------- HEADER ---------- */}
      <View style={styles.header}>
        {path.length > 0 && (
          <TouchableOpacity onPress={goBack}>
            <ArrowLeft size={22} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>
          {path.length === 0 ? 'File📦' : path[path.length - 1].name}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={uploadFile}>
            <Upload size={22} />
          </TouchableOpacity>
          <TouchableOpacity onPress={createFolder}>
            <Plus size={24} />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={current}
        keyExtractor={item => item.id}
        renderItem={renderItem}
      />
    </View>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f1f1f1',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  name: {
    fontSize: 16,
  },
  input: {
    borderBottomWidth: 1,
    minWidth: 120,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 14,
  },
});