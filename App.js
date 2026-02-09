import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar, 
  SafeAreaView, TextInput, Modal, Alert, ActivityIndicator 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from './supabase'; 

// --- PAYTM THEME COLORS ---
const COLORS = {
  primary: '#00BAF2', // Paytm Blue
  darkBlue: '#0F2C5C',
  bg: '#F5F7FA',
  white: '#FFFFFF',
  text: '#1D2129',
  grey: '#8A94A6',
  green: '#21C17A',
  red: '#FF3B30',
};

export default function App() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form Data
  const [name, setName] = useState('');
  const [batch, setBatch] = useState('');
  const [qty, setQty] = useState('');
  const [expiry, setExpiry] = useState('');

  // --- 1. LOAD DATA ON START ---
  const fetchInventory = async () => {
    setLoading(true);
    // Fetch data from Supabase 'batches' table
    const { data, error } = await supabase
      .from('batches')
      .select(`
        id, batch_no, expiry_date, current_stock,
        products (name)
      `)
      .order('expiry_date', { ascending: true }); // FEFO Logic

    if (error) {
      console.error(error); // Log error silently
    } else {
      setInventory(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // --- 2. SAVE STOCK TO DATABASE ---
  const handleAddStock = async () => {
    if (!name || !batch || !qty || !expiry) {
      Alert.alert("Missing Details", "Please fill all fields.");
      return;
    }

    setLoading(true);

    // A. Create/Find Product
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert([{ name: name }])
      .select()
      .single();

    if (productError) {
      Alert.alert("Error", "Could not create product: " + productError.message);
      setLoading(false);
      return;
    }

    // B. Create Batch
    const { error: batchError } = await supabase
      .from('batches')
      .insert([{
        product_id: productData.id,
        batch_no: batch,
        expiry_date: expiry,
        current_stock: parseInt(qty),
        mrp: 0 
      }]);

    if (batchError) {
      Alert.alert("Error", batchError.message);
    } else {
      Alert.alert("Success", "✅ Stock Added to Godown!");
      setModalVisible(false);
      // Reset Form
      setName(''); setBatch(''); setQty(''); setExpiry('');
      fetchInventory(); // Refresh List
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.logoText}>Pharma<Text style={{fontWeight:'bold'}}>Book</Text></Text>
          <TouchableOpacity onPress={fetchInventory}>
            <Ionicons name="refresh" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.profileCard}>
          <View>
             <Text style={styles.shopName}>Mahadev Pharma Distributors</Text>
             <Text style={styles.locationText}>Total SKUs: {inventory.length}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        
        {/* QUICK ACTIONS */}
        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.actionItem} onPress={() => setModalVisible(true)}>
             <View style={[styles.iconCircle, { backgroundColor: '#EDF9FE' }]}>
                <Ionicons name="cube-outline" size={28} color={COLORS.primary} />
             </View>
             <Text style={styles.actionLabel}>Add Stock</Text>
          </TouchableOpacity>

          <View style={styles.actionItem}>
             <View style={[styles.iconCircle, { backgroundColor: '#FFF0F0' }]}>
                <Ionicons name="alert-circle-outline" size={28} color={COLORS.red} />
             </View>
             <Text style={styles.actionLabel}>Expiry Alert</Text>
          </View>
        </View>

        {/* INVENTORY LIST */}
        <Text style={styles.sectionTitle}>Godown Inventory</Text>
        
        {loading ? <ActivityIndicator size="large" color={COLORS.primary} /> : (
          <View style={styles.transactionList}>
            {inventory.length === 0 ? (
                <Text style={{padding:20, textAlign:'center', color:COLORS.grey}}>
                    Godown is empty. Add stock above.
                </Text>
            ) : (
                inventory.map((item, index) => (
                  <View key={index} style={styles.txItem}>
                    <View style={styles.txLeft}>
                      <View style={[styles.txIcon, {backgroundColor: '#E6F9F0'}]}>
                        <MaterialCommunityIcons name="pill" size={18} color={COLORS.green} />
                      </View>
                      <View>
                        <Text style={styles.txName}>{item.products?.name || "Medicine"}</Text>
                        <Text style={styles.txBatch}>Batch: {item.batch_no} • Exp: {item.expiry_date}</Text>
                      </View>
                    </View>
                    <View style={{alignItems:'flex-end'}}>
                      <Text style={styles.txQty}>{item.current_stock}</Text>
                      <Text style={styles.txTime}>Boxes</Text>
                    </View>
                  </View>
                ))
            )}
          </View>
        )}
        
        <View style={{height: 100}} />
      </ScrollView>

      {/* ADD STOCK MODAL */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Incoming Stock Entry</Text>
            
            <Text style={styles.label}>Medicine Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Dolo 650" value={name} onChangeText={setName} />
            
            <Text style={styles.label}>Batch Number</Text>
            <TextInput style={styles.input} placeholder="e.g. A21X" value={batch} onChangeText={setBatch} />
            
            <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                <View style={{width:'48%'}}>
                    <Text style={styles.label}>Expiry (YYYY-MM-DD)</Text>
                    <TextInput style={styles.input} placeholder="2026-12-31" value={expiry} onChangeText={setExpiry} />
                </View>
                <View style={{width:'48%'}}>
                    <Text style={styles.label}>Quantity</Text>
                    <TextInput style={styles.input} placeholder="50" keyboardType="numeric" value={qty} onChangeText={setQty} />
                </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddStock}>
              <Text style={styles.saveBtnText}>SAVE TO GODOWN</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { backgroundColor: COLORS.primary, paddingBottom: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  logoText: { color: COLORS.white, fontSize: 20, marginLeft: 10, flex: 1 },
  profileCard: { backgroundColor: COLORS.white, marginHorizontal: 15, padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 5 },
  shopName: { fontSize: 16, fontWeight: 'bold', color: COLORS.darkBlue },
  locationText: { fontSize: 12, color: COLORS.grey, marginTop: 4 },
  content: { flex: 1, padding: 15 },
  gridContainer: { flexDirection: 'row', marginBottom: 20 },
  actionItem: { alignItems: 'center', width: '25%' },
  iconCircle: { width: 55, height: 55, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, color: COLORS.text, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.darkBlue, marginBottom: 15 },
  transactionList: { backgroundColor: COLORS.white, borderRadius: 12, padding: 5 },
  txItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F0F2F5', alignItems: 'center' },
  txLeft: { flexDirection: 'row', alignItems: 'center' },
  txIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  txBatch: { fontSize: 11, color: COLORS.grey, marginTop: 2 },
  txQty: { fontSize: 16, fontWeight: 'bold', color: COLORS.darkBlue },
  txTime: { fontSize: 10, color: COLORS.grey },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 10, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.darkBlue, marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 12, color: COLORS.grey, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  saveBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { padding: 10, alignItems: 'center' },
  cancelBtnText: { color: COLORS.grey, fontSize: 14 }
});