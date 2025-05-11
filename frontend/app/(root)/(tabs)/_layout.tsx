import { View, Text, Image } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import icons from '@/constants/icons'

const TabIcon = ({focused, icon, title}:
    {
        focused:boolean
        icon:any
        title:string
    }
) => (
    <View className='flex-1 mt-3 flex flex-col items-center'>
        <Image source ={icon} tintColor={focused? '#0061ff':'#666876'} resizeMode='contain' className='size-6 '></Image>
        <Text className={`${focused ?
            'text-blue-600 font-rubik-medium':'text-white font-rubik'} text-xs w-full text-center mt-1`}>
                {title}
            </Text>
    </View>
)

const TabsLayout = () => {
  return (
    <Tabs
        screenOptions={{
            tabBarShowLabel:false,
            tabBarStyle: {
                backgroundColor:'black',
                position:'absolute',
                borderTopColor:'#0061ff1a',
                borderTopWidth:1,
                minHeight:70,
                elevation: 0,                     // remove Android shadow
                shadowOpacity: 0,                 // remove iOS shadow
            }
        }}>
        <Tabs.Screen
            name='index'
            options={{
                title:'Home',
                headerShown:false,
                tabBarIcon: ({focused}) => (
                    <TabIcon icon={icons.home} focused={focused} title='Home'></TabIcon>
                )
            }}>
        </Tabs.Screen>
        <Tabs.Screen
            name='Scenarios'
            options={{
                title:'Scenarios',
                headerShown:false,
                tabBarIcon: ({focused}) => (
                    <TabIcon icon={icons.run} focused={focused} title='Scenarios'></TabIcon>
                )
            }}>
        </Tabs.Screen>
        <Tabs.Screen
            name='Profile'
            options={{
                title:'Profile',
                headerShown:false,
                tabBarIcon: ({focused}) => (
                    <TabIcon icon={icons.person} focused={focused} title='Profile'></TabIcon>
                )
            }}>
        </Tabs.Screen>
    </Tabs>
  )
}

export default TabsLayout