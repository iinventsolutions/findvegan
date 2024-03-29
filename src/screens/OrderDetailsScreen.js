import React, { useCallback, useMemo, useRef, useState, useEffect, Alert } from 'react';
import {View, Text, StyleSheet, Image, Pressable, FlatList, ActivityIndicator} from 'react-native'
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { container, input } from 'aws-amplify';
import { useNavigation } from '@react-navigation/native';
import { getBasketTotal } from '../components/BasketContex/reducer';
import { useStateValue } from '../components/BasketContex/StateProvider';
import CartItem from '../components/CartItem';
import { useRoute } from '@react-navigation/native';
import { useOrderContext } from '../contexts/OrderContex';
import Toast from 'react-native-toast-message'
import { DataStore } from 'aws-amplify';
import { UserMobile } from '../models';

// BottomSheet imports
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import 'react-native-gesture-handler';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import LoadingItems from '../components/LoadingItems';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { GOOGLE_MAP_API } from '../Utils/Constants';
import { useAuthContext } from '../contexts/AuthContext';

// Google Autocomplete imports
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';


const OrderDetailsScreen = () => {

  navigator.geolocation = require('react-native-geolocation-service');

  const { sub, setDbUser, dbUser } = useAuthContext();
  const { createOrder } = useOrderContext()
  // BottomSheet Start
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isOpen, setIsOpen] = useState(false)
  const [googlePlaceName, setGooglePlaceName] = useState(null)
  const [location, setLocation] = useState(null); //Expo-location state


  // variables
  const snapPoints = useMemo(() => ["75%"], []);

  // callbacks
  const handleSheetChanges = useCallback((index) => {
    console.log('handleSheetChanges', index);
  }, []);
  // BottomSheet end



  const navigation = useNavigation();
  const [{basket}, dispatch] = useStateValue();
  const route = useRoute();
  const df = route.params?.df //delivery fee

  const googleMapApi = process.env.GOOGLE_MAP_API

  const checkOut = () => { 
    navigation.navigate("Payment Options")
  }

  const handleCreateOrder = () => { 
    // createOrder()
    navigation.navigate("Payment Options", {df})
    }

  // Toast Message TODO
  const showToast = (lat, lng) => {
    // console.warn("Test: ",lat, lng)
    Toast.show({
      type: 'success',
      text1: 'Location selected',
      text2: `lat: ${lat}, lng: ${lng}`,
      // props: {style: {fontSize: 20}}
    });
    
  }

  const showErrorToast = (err) => {
    Toast.show({
      type: 'error',
      text1: `${err.message}`,
      // props: {style: {fontSize: 20}}
    });
  }

  const updateUser = async (lat, lng) => {
    // console.warn(lat, lng)
    try {
      await DataStore.save(
        UserMobile.copyOf(dbUser, updated => {
          updated.lat = parseFloat(lat);
          updated.lng = parseFloat(lng);
        })
      )
      // setDbUser(user)
      showToast(lat, lng)
    } catch (error) {
      showErrorToast(error)
    }
  }

  // Expo Geo-Location Starts here
  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission to access location was denied');
      return;
    }
  
    let locationData = await Location.getCurrentPositionAsync({});
    
    // console.log("Location details: ",location)
    if(locationData){
      setLocation(locationData);
      // console.warn(location?.coords?.latitude, location?.coords?.longitude)
      // updateUser(location?.coords?.latitude, location?.coords?.longitude)
      console.warn("Location fetched")
    }else{
      // showErrorToast()
      console.warn("Error getting location...")
    }
  };
  
  useEffect(() => {
    getLocation();
  }, []);

  

  // Expo Geo-Location Ends here

  return (
    // <ScrollView>
    <GestureHandlerRootView style={[styles.container, {backgroundColor: isOpen? 'grey': '#fff'}]}>
      <FlatList 
          // horizontal
          // showsHorizontalScrollIndicator={false}
          data = {basket}
          renderItem = {({item})=> <CartItem basketinfo={item} />}
          showsVerticalScrollIndicator = {false}
        />
        

      <View style={styles.subTotal}>
        <View>
          <Text style={styles.subInfo}>Subtotal</Text>
          <Text style={styles.subInfo}>Delivery</Text>
          <Text style={styles.subInfo}>Total (inl. VAT)</Text>
          <Text style={styles.addMore}>Add more items</Text>
        </View>
        <View>
          <Text style={styles.subInfo}>GH¢{getBasketTotal(basket).toFixed(2)>0?((getBasketTotal(basket)).toFixed(2)):0}</Text>
          <Text style={styles.subInfo}>GHS{df?.toFixed(2)}</Text>
          <Text style={styles.subInfo}>GH¢{getBasketTotal(basket).toFixed(2)>0?((getBasketTotal(basket)+df).toFixed(2)):0}</Text>
          <MaterialIcons style={styles.arrow} name="keyboard-arrow-right" size={24} color="black" />
        </View>
      </View>

      <Pressable style={styles.button} onPress={()=>{setIsOpen(true)}}>
        <Text style={{color: 'white', fontWeight: 'bold'}}>CONFIRM ORDER</Text>
      </Pressable>
      {isOpen && <BottomSheet
          innderRef={bottomSheetRef}
          index={0}
          enablePanDownToClose={true}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          onClose={()=>setIsOpen(false)}
        >
          <BottomSheetView style={styles.contentContainer}>
          <View style={{width: '90%',flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={{fontSize: 24, fontWeight: 'bold'}}>Checkout</Text>
            <ActivityIndicator size={28} color='#419D47'/>
          </View>

          {/* <View>
            <Text>Latitude: {location?.coords?.latitude}</Text>
            <Text>Longitude: {location?.coords?.longitude}</Text>
          </View> */}

          {/* Google Places autocomplete starts here */}
          <View style={{width: '100%', display: 'flex', alignItems: 'center', position: 'relative'}}>
            <View style={styles.GooglePlacesSearch}>
            <Ionicons name="location-sharp" size={18} style={{opacity: 0.5, marginTop: 13}} color="black" />
              <GooglePlacesAutocomplete
                placeholder='Enter Location'
                // currentLocation={true} // Will add a 'Current location' button at the top of the predefined places list
                // currentLocationLabel="Current location"
                fetchDetails={true}
                nearbyPlacesAPI= "true"
                enablePoweredByContainer={false}
                styles={{textInput: styles.input}}
                getCurrentLocation
                onPress={(data, details = null) => {
                  // 'details' is provided when fetchDetails = true
                  // console.log("Map data is: ",details);
                  // console.warn(details.geometry.location.lat, details.geometry.location.lng)
                  updateUser(details.geometry.location.lat, details.geometry.location.lng)
                  // setGooglePlaceName(data.description)
                }}
                onFail={(error) => console.error("Map error is: ",error)}
                query={{
                  key: process.env.GOOGLE_API_KEY,
                  language: 'en',
                  components: 'country:gh'
                }}
                
              />
            </View>
          </View>
          {/* Google Places autocomplete ends here */}
          <View style={{display: 'flex', width: '100%', marginTop: 10}}>
            <Text style={{fontWeight: '500', color: 'gray'}} onPress={()=>updateUser(location?.coords?.latitude, location?.coords?.longitude)}>Select Current Location</Text>
          </View>

              <ScrollView style={{width: '100%'}} showsVerticalScrollIndicator={false}>
              {/* <View style={{ alignItems: 'center' }}> */}
 
              <View>
                <LoadingItems title={googlePlaceName} sub={'Meet at door'} />
                <LoadingItems title={'Standard delivery: 10-20 min'} sub={''}/>
                <LoadingItems title={''} sub={'My order,Derek'}/>
              </View>
              <Pressable style={[styles.button, {margin: 30}]} onPress={handleCreateOrder}>
                <Text style={{color: 'white', fontWeight: 'bold'}}>CREATE ORDER</Text>
              </Pressable>
              {/* </View> */}
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>}
    </GestureHandlerRootView>
    // </ScrollView>
  )
}

export default OrderDetailsScreen

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    backgroundColor: '#fff',
    height: '100%',
    alignItems: 'center',
    // justifyContent: 'center',
    // marginTop: 50
  },

  contentContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20
  },

  foodList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    borderBottomWidth: 1,
    // opacity: 0.5,
    borderColor: '#F3F3F3',
    height: 100
  },
  button: {
    backgroundColor: '#419D47',
    width: 300,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 50
  },
  subTotal: {
    // borderWidth: 1,
    width: '90%',
    height: 130,
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  subInfo: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 35
  },

  addMore: {
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 45,
    color: '#419D47'
  },

  arrow: {
    fontWeight: '500',
    lineHeight: 45,
  },

  GooglePlacesSearch: {
      // position: 'absolute',
      justifyContent: 'center',
      // alignItems: 'center',
      display: 'flex',
      flexDirection: 'row',
      marginTop: 10,
      backgroundColor: '#fff',
      // height: 55,
      // height: 'auto',
      width: '98%',
      shadowColor: 'black',
      shadowOffset: {
          width: 2,
          height: 2,
      },
      shadowOpacity: 0.5,
      shadowRadius: 4,
      elevation: 4,
      padding: 5,
      borderRadius: 5,
  },
  
  input: {
    // borderWidth: 1
  }
});